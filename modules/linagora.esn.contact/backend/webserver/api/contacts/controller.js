'use strict';

const ICAL = require('ical.js'),
      charAPI = require('charAPI');

const DEFAULT_AVATAR_SIZE = 256,
      DEFAULT_SEARCH_LIMIT = 3;

module.exports = dependencies => {
  const logger = dependencies('logger'),
        avatarGenerationModule = dependencies('image').avatarGenerationModule,
        contactClient = require('../../../lib/client')(dependencies),
        searchClient = require('../../../lib/search')(dependencies);

  function _getContactAvatar(contact, size) {
    const vcard = new ICAL.Component(contact),
          formattedName = vcard.getFirstPropertyValue('fn'),
          contactId = vcard.getFirstPropertyValue('uid'),
          photo = vcard.getFirstPropertyValue('photo');

    // Detect existing avatar, see more about vcard's photo field spec here:
    // https://tools.ietf.org/html/rfc6350#section-6.2.4
    if (photo) {
      if (photo.indexOf('data:image') === 0) {
        return new Buffer(photo.split(',')[1], 'base64');
      } else if (photo.indexOf('http') === 0) {
        return photo;
      }

      logger.warn('Unsupported photo URI', photo);
    }

    let firstChar;

    if (!formattedName) {
      firstChar = '#';
    } else {
      firstChar = charAPI.getAsciiUpperCase(formattedName.charAt(0));

      if (!firstChar) {
        firstChar = '#';
      }
    }

    const colors = avatarGenerationModule.getColorsFromUuid(contactId),
          options = {
            text: firstChar,
            bgColor: colors.bgColor,
            fgColor: colors.fgColor
          };

    if (size) {
      options.size = size;
    }

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
    const addressBookId = req.params.addressBookId,
          addressbookName = req.params.addressbookName,
          contactId = req.params.contactId,
          avatarSize = req.query.size ? req.query.size : DEFAULT_AVATAR_SIZE,
          clientOptions = {
            ESNToken: req.token && req.token.token ? req.token.token : '',
            davserver: req.davserver
          };

    contactClient(clientOptions)
      .addressbookHome(addressBookId)
      .addressbook(addressbookName)
      .vcard(contactId)
      .get()
      .then(data => {
        const avatar = _getContactAvatar(data.body, avatarSize);

        if (typeof avatar === 'string') {
          res.redirect(avatar);
        } else {
          res.type('png');
          res.send(avatar);
        }
      }, err => {
        logger.error(err);

        res.status(404).send('Sorry, we cannot find avatar with your request!');
      });
  }

  function searchContacts(req, res) {
    const query = {
      search: req.query.q,
      limit: +req.query.limit || DEFAULT_SEARCH_LIMIT,
      userId: req.user.id
    };

    searchClient.searchContacts(query, (err, result) => {
      if (err) {
        return res.status(500).json({ error: { code: 500, message: 'Error while searching contacts', details: err.message } });
      }

      if (result.total_count === 0) {
        return res.status(204).end();
      }

      res.status(200).json(result.list.map(contact => contact._source));
    });
  }

  return {
    _getContactAvatar,
    getAvatar,
    searchContacts
  };

};
