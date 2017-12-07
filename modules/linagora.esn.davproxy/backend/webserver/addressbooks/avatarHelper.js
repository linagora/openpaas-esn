'use strict';

var ICAL = require('@linagora/ical.js');
var q = require('q');

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var configHelpers = dependencies('helpers').config;

  function buildTextAvatarUrl(baseUrl, addressBookId, addressbookName, contactId) {
    return [
      baseUrl,
      'contact/api/contacts',
      addressBookId,
      addressbookName,
      contactId,
      'avatar'
    ].join('/');
  }

  function getTextAvatarUrl(user, addressBookId, addressbookName, contactId) {
    var deferred = q.defer();

    configHelpers.getBaseUrl(user, function(err, baseUrl) {
      if (err) {
        return deferred.reject(err);
      }

      deferred.resolve(buildTextAvatarUrl(baseUrl, addressBookId, addressbookName, contactId));
    });

    return deferred.promise;
  }

  /**
   * Inject text avatar if there's no avatar in the vcard contact data. Note
   * that this will always resolve promise, if it gets getTextAvatarUrl rejected,
   * the original vcardData will be resolved.
   *
   * @param  {Object} user
   * @param  {String} addressBookId Address book ID
   * @param  {String} addressBookName Address book name
   * @param  {Object} vcardData     vcard data in json
   * @return {Promise}              resolve vcard with avatar injected or the
   *                                  original vcard if the contact has avatar already.
   */
  function injectTextAvatar(user, addressBookId, addressbookName, vcardData) {
    try {
      var vcard = new ICAL.Component(vcardData);

      if (!vcard.getFirstPropertyValue('photo')) {
        var contactId = vcard.getFirstPropertyValue('uid');

        return getTextAvatarUrl(user, addressBookId, addressbookName, contactId)
          .then(function(avatarUrl) {
            vcard.addPropertyWithValue('photo', avatarUrl);
            return vcard.toJSON();
          }, function(err) {
            logger.warn('Failed to inject text avatar:', err);
            return vcardData;
          });
      }
    } catch (err) {
      logger.warn('Failed to inject text avatar:', err);
    }

    return q.resolve(vcardData);

  }

  /**
   * Remove text avatar url from vcard data of contact. This is a workaround
   * to prevent frontend from accidentally insert text avatar to the database.
   *
   * @param  {Object} vcardData
   * @return {Object}
   */
  function removeTextAvatar(vcardData) {
    try {
      var vcard = new ICAL.Component(vcardData);
      var avatarUrl = vcard.getFirstPropertyValue('photo');

      if (avatarUrl && avatarUrl.match(/\/contact\/api\/contacts\/.*?\/avatar/)) {
        vcard.removeProperty('photo');
        return vcard.toJSON();
      }
    } catch (err) {
      logger.warn('Failed to remove text avatar:', err);
    }

    return vcardData;
  }

  return {
    injectTextAvatar: injectTextAvatar,
    removeTextAvatar: removeTextAvatar
  };
};
