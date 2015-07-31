'use strict';


var ICAL = require('ical.js');
var q = require('q');
var DEFAULT_BASE_URL = 'http://localhost:8080';

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var esnconfig = dependencies('esn-config');


  /**
   * Get base_url configuration from esnconfig. DEFAULT_BASE_URL will be used
   * when the configuration is not present.
   *
   * @return {Promise}
   */
  function getBaseUrl() {
    var baseUrl;
    var deferred = q.defer();

    esnconfig('web').get(function(err, web) {
      if (err) {
        logger.error('Error while getting esn-config', err);
        return deferred.reject(err);
      }
      if (web && web.base_url) {
        baseUrl = web.base_url;
      } else {
        baseUrl = DEFAULT_BASE_URL;
      }
      deferred.resolve(baseUrl);
    });

    return deferred.promise;
  }


  function buildTextAvatarUrl(baseUrl, addressBookId, contactId) {
    return [
      baseUrl,
      'contact/api/contacts',
      addressBookId,
      contactId,
      'avatar'
    ].join('/');
  }

  function getTextAvatarUrl(addressBookId, contactId) {
    return getBaseUrl().then(function(baseUrl) {
      return buildTextAvatarUrl(baseUrl, addressBookId, contactId);
    });
  }

  /**
   * Inject text avatar if there's no avatar in the vcard contact data. Note
   * that this will always resolve promise, if it gets getTextAvatarUrl rejected,
   * the original vcardData will be resolved.
   *
   * @param  {String} addressBookId Address book ID
   * @param  {Object} vcardData     vcard data in json
   * @return {Promise}              resolve vcard with avatar injected or the
   *                                  original vcard if the contact has avatar already.
   */
  function injectTextAvatar(addressBookId, vcardData) {
    try {
      var vcard = new ICAL.Component(vcardData);

      if (!vcard.getFirstPropertyValue('photo')) {
        var contactId = vcard.getFirstPropertyValue('uid');

        return getTextAvatarUrl(addressBookId, contactId)
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
