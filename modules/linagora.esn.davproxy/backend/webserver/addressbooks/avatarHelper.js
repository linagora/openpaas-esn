'use strict';


var ICAL = require('ical.js');
var DEFAULT_BASE_URL = 'http://localhost:8080';

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var staticConfig = dependencies('config')('default');
  var baseUrl = staticConfig.base_url ? staticConfig.base_url : DEFAULT_BASE_URL;

  function getTextAvatarUrl(addressBookId, contactId) {
    return [
      baseUrl,
      'contact/api/contacts',
      addressBookId,
      contactId,
      'avatar'
    ].join('/');
  }

  /**
   * Inject text avatar if there's no avatar in the vcard contact data.
   *
   * @param  {String} addressBookId Address book ID
   * @param  {Object} vcardData     vcard data in json
   * @return {Object}               vcard with avatar injected or the original
   *                                  vcard if the contact has avatar already.
   */
  function injectTextAvatar(addressBookId, vcardData) {
    try {
      var vcard = new ICAL.Component(vcardData);

      if (!vcard.getFirstPropertyValue('photo')) {
        var contactId = vcard.getFirstPropertyValue('uid');
        vcard.addPropertyWithValue('photo',
          getTextAvatarUrl(addressBookId, contactId));
        return vcard.toJSON();
      }
    } catch (err) {
      logger.warn('Failed to inject text avatar:', err);
    }

    return vcardData;
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
