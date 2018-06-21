const ICAL = require('@linagora/ical.js');
const q = require('q');
const uuidV4 = require('uuid/v4');
const helper = require('../helper');

const CONTENT_TYPE = 'text/vcard';
const START_LINE = /^BEGIN:VCARD\r?$/;
const END_LINE = /^END:VCARD\r?$/;

module.exports = function(dependencies) {
  const logger = dependencies('logger');
  const client = require('../client')(dependencies);

  return {
    contentType: CONTENT_TYPE,
    readLines,
    importItem,
    targetValidator
  };

  function readLines(lines, remainingLines) {
    const items = [];
    let readingLines = remainingLines ? remainingLines.slice() : [];

    lines.forEach(line => {
      // skip until the start line
      if (readingLines.length === 0 && !START_LINE.test(line)) {
        return;
      }

      readingLines.push(line);

      if (END_LINE.test(line)) {
        items.push(readingLines.join('\n'));
        readingLines = [];
      }
    });

    return {
      items,
      remainingLines: readingLines
    };
  }

  function importItem(item, { target, token }) {
    const { bookHome, bookName } = helper.parseAddressbookPath(target);

    if (!bookHome || !bookName) {
      return q.reject(new Error(`${target} is not a valid address book path`));
    }

    const vcard = ICAL.Component.fromString(item);
    const contactId = uuidV4();

    // set the new ID for being imported vcard
    vcard.removeProperty('uid');
    vcard.addPropertyWithValue('uid', contactId);

    return client({
        ESNToken: token
      })
      .addressbookHome(bookHome)
      .addressbook(bookName)
      .vcard(contactId)
      .create(vcard.toJSON())
      .then(() => {
        logger.debug(`Imported contact ${contactId} to ${target}`);
      })
      .catch(err => {
        logger.error('Error while importing contact', err);
        throw err;
      });
  }

  function targetValidator(user, target) {
    // user can be later used to check if user has write access to the target address book path
    const { bookHome, bookName } = helper.parseAddressbookPath(target);

    return Boolean(bookHome || bookName);
  }
};
