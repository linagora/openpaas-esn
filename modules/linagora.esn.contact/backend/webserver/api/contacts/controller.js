'use strict';


var ical = require('ical.js');
var PATH = 'addressbooks';

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var avatarModule = dependencies('image').avatarModule;
  var davClient = require('../../../lib/dav-client');

  function buildContactUrl(options) {
    return [
      options.davserver,
      PATH,
      options.addressBookId,
      'contacts',
      options.contactId + '.vcf'
    ].join('/');
  }

  function getContactFromDav(contactUrl, esnToken) {
    var options = {
      url: contactUrl,
      headers: { ESNToken: esnToken }
    };
    return davClient.get(options);
  }

  function _getContactAvatar(contact, size) {
    var vcard = new ical.Component(contact);
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
      firstChar = formattedName.charAt(0);
      if (!firstChar.match(/[a-z]/i)) {
        firstChar = '#';
      }
    }

    var colors = avatarModule.getColorsFromUuid(contactId);
    var options = {
      text: firstChar,
      bgColor: colors.bgColor,
      fgColor: colors.fgColor
    };
    if (size) { options.size = size; }

    return avatarModule.generateFromText(options);
  }

  /**
   * Get avatar of contact. If the contact doesn't have, a letter avatar will
   * be used.
   * See more about letter avatar in core/image/avatar module
   * @param  {Request} req Request object that has query data:
   *                       - size: size of avatar, default value is 128
   * @param  {response} res Response object
   */
  function getAvatar(req, res) {
    var addressBookId = req.params.addressBookId;
    var contactId = req.params.contactId;
    var esnToken = req.token && req.token.token ? req.token.token : '';
    var avatarSize = req.query.size ? req.query.size : 128;

    var contactUrl = buildContactUrl({
      davserver: req.davserver,
      addressBookId: addressBookId,
      contactId: contactId
    });

    getContactFromDav(contactUrl, esnToken)
    .then(function(contact) {
      var avatar = _getContactAvatar(contact, avatarSize);
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
