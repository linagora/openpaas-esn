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
      'dav:acl': ['dav:read']
    };

    logger.debug('Creating import addressbook', addressbook);

    return getCreationToken().then(function(token) {
      return contactModule.lib.client({ESNToken: token.token})
        .addressbookHome(user._id)
        .addressbook()
        .create(addressbook)
        .then(function() {
          options.addressbook = addressbook;
          return q(options);
        }, function(err) {
          return q.reject(err);
        });
    });
  }

  function getImporterOptions(user, account) {
    var defer = q.defer();

    var options = {
      account: account,
      user: user
    };

    technicalUser.findByTypeAndDomain(TECHNICAL_USER_TYPE, user.domains[0].domain_id, function(err, users) {
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

  return {
    initializeAddressBook: initializeAddressBook,
    getImporterOptions: getImporterOptions
  };
};
