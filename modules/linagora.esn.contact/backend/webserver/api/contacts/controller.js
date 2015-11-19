'use strict';

var ICAL = require('ical.js');
var charAPI = require('charAPI');
var DEFAULT_AVATAR_SIZE = 256;

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var avatarGenerationModule = dependencies('image').avatarGenerationModule;
  var contactClient = require('../../../lib/client')(dependencies);

  function _getContactAvatar(contact, size) {
    var vcard = new ICAL.Component(contact);
    var formattedName = vcard.getFirstPropertyValue('fn');
    var contactId = vcard.getFirstPropertyValue('uid');
    var photo = vcard.getFirstPropertyValue('photo');

    // Detect existing avatar, see more about vcard's photo field spec here:
    // https://tools.ietf.org/html/rfc6350#section-6.2.4
    if (photo) {
      if (photo.indexOf('data:image') === 0) {
        return new Buffer(photo.split(',')[1], 'base64');
      } else if (photo.indexOf('http') === 0) {
        return photo;
      } else {
        logger.warn('Unsupported photo URI', photo);
      }
    }
    var firstChar;

    if (!formattedName) {
      firstChar = '#';
    } else {
      firstChar = charAPI.getAsciiUpperCase(formattedName.charAt(0));
      if (!firstChar) {
        firstChar = '#';
      }
    }

    var colors = avatarGenerationModule.getColorsFromUuid(contactId);
    var options = {
      text: firstChar,
      bgColor: colors.bgColor,
      fgColor: colors.fgColor
    };
    if (size) { options.size = size; }

    return avatarGenerationModule.generateFromText(options);
  }

  /**
   * Get avatar of contact. If the contact doesn't have, a letter avatar will
   * be used.
   * See more about letter avatar in core/image/avatar module
   * @param  {Request} req Request object that has query data:
   *                       - size: size of avatar, default value is DEFAULT_AVATAR_SIZE
   * @param  {response} res Response object
   */
  function getAvatar(req, res) {
    var addressBookId = req.params.addressBookId;
    var contactId = req.params.contactId;
    var esnToken = req.token && req.token.token ? req.token.token : '';
    var avatarSize = req.query.size ? req.query.size : DEFAULT_AVATAR_SIZE;

    contactClient({ ESNToken: esnToken })
    .addressbook(addressBookId)
    .contacts(contactId)
    .get()
    .then(function(data) {
      var avatar = _getContactAvatar(data.body, avatarSize);
      if (typeof avatar === 'string') {
        res.redirect(avatar);
      } else {
        res.type('png');
        res.send(avatar);
      }
    }, function(err) {
      logger.error(err);
      res.status(404).send('Sorry, we cannot find avatar with your request!');
    });
  }

  return {
    _getContactAvatar: _getContactAvatar,
    getAvatar: getAvatar
  };

};
