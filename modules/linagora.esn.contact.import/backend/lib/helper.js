'use strict';

var q = require('q');
var TECHNICAL_USER_TYPE = 'dav';
var TOKEN_TTL = 20000;

module.exports = function(dependencies) {

  var technicalUser = dependencies('technical-user');
  var userModule = dependencies('user');
  var contactModule = dependencies('contact');
  var logger = dependencies('logger');

  function initializeAddressBook(options) {

    function getCreationToken() {
      var defer = q.defer();
      userModule.getNewToken(options.user, TOKEN_TTL, function(err, token) {
        if (err) {
          return defer.reject(err);
        }

        if (!token) {
          return defer.reject(new Error('Can not generate user token for contact addressbook creation'));
        }

        defer.resolve(token);
      });
      return defer.promise;
    }

    var account = options.account;
    var user = options.user;
    var id = account.data.id;
    var addressbook = {
      id: id,
      'dav:name': account.data.username + ' contacts on ' + account.data.provider,
      'carddav:description': 'AddressBook for ' + account.data.username + ' ' + account.data.provider + ' contacts',
      'dav:acl': ['dav:read'],
      type: account.data.provider
    };
    options.addressbook = addressbook;

    return getCreationToken()
      .then(function(token) {
        var contactClient = contactModule.lib.client({
          ESNToken: token.token,
          user: user
        });

        return contactClient.addressbookHome(user._id)
          .addressbook(addressbook.id)
          .get()
          .catch(function() {
            logger.debug('Creating import addressbook', addressbook);

            return contactClient.addressbookHome(user._id)
              .addressbook()
              .create(addressbook);
          });
      })
      .then(function() {
        return options;
      });
  }

  function getImporterOptions(user, account) {
    var defer = q.defer();

    var options = {
      account: account,
      user: user
    };

    technicalUser.findByTypeAndDomain(TECHNICAL_USER_TYPE, user.preferredDomainId, function(err, users) {
      if (err) {
        return defer.reject(err);
      }

      if (!users || !users.length) {
        return defer.reject(new Error('Can not find technical user for contact import'));
      }

      technicalUser.getNewToken(users[0], TOKEN_TTL, function(err, token) {
        if (err) {
          return defer.reject(err);
        }

        if (!token) {
          return defer.reject(new Error('Can not generate token for contact import'));
        }

        options.esnToken = token.token;
        defer.resolve(options);
      });
    });

    return defer.promise;
  }

  /**
   * Remove outdated contacts from addressbook. We use `lastmodified` field of
   * vcard to detect followings removed from user Twitter account.
   * Note:
   * - Sabre use `lastmodified` timestamp in seconds
   * @param  {Object} options           Contains:
   *                                    	+ user
   *                                    	+ addressbook
   *                                    	+ esnToken
   * @param  {Number} contactSyncTimeStamp Timestamp in miliseconds
   * @return {Promise}                   Resolve a list of removed contact IDs
   */
  function cleanOutdatedContacts(options, contactSyncTimeStamp) {
    return contactModule.lib.client({
        ESNToken: options.esnToken,
        user: options.user
      })
      .addressbookHome(options.user._id)
      .addressbook(options.addressbook.id)
      .vcard()
      .removeMultiple({
        modifiedBefore: Math.round(contactSyncTimeStamp / 1000)
      })
      .then(function(ids) {
        logger.info('Cleaned %d outdated contacts', ids.length);
        return ids;
      }, function(err) {
        logger.error('Cannot clean outdated contacts due to error:', err);
        return q.reject(err);
      });
  }

  return {
    initializeAddressBook: initializeAddressBook,
    getImporterOptions: getImporterOptions,
    cleanOutdatedContacts: cleanOutdatedContacts
  };
};
