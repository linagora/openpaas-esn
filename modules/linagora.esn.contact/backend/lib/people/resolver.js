module.exports = dependencies => {
  const client = require('../client')(dependencies);
  const peopleModule = dependencies('people');
  const ICAL = require('@linagora/ical.js');
  const { token } = dependencies('auth');
  const { FIELD_TYPES } = peopleModule.constants;
  const EMAIL_PROPERTY = 'email';

  /**
   * Contacts resolver
   * This is a temporary method to resolve contact.
   * ElasticSearch lacks the integritiy in getting the exact contacts for a specific field.
   *
   * TODO: Implement a method to directly 'get' contacts by a field value to DAV server.
   */
  return ({ fieldType, value, context }) => {
    const options = {
      user: context.user,
      search: value
    };

    return getClientOptions(context)
      .then(clientOptions => client(clientOptions).searchContacts(options))
      .then(data => {
        if (!data.results || !data.results.length) {
          return;
        }

        if (fieldType === FIELD_TYPES.EMAIL_ADDRESS) {
          return findMatchingContact(data.results, EMAIL_PROPERTY, value);
        }
      });
  };

  function getClientOptions({ user }) {
    return new Promise((resolve, reject) => {
      token.getNewToken({ user: user._id }, (err, token) => {
        if (err) {
          return reject(err);
        }

        resolve({ ESNToken: token.token });
      });
    });
  }

  function findMatchingContact(data, prop, value) {
    const parsedContacts = data.map(contact => new ICAL.Component(contact.body));
    let index;

    if (prop === EMAIL_PROPERTY) {
      index = parsedContacts.findIndex(contact => {
        const emails = contact.getAllProperties(EMAIL_PROPERTY).map(prop => prop.getFirstValue().replace(/^mailto:/i, ''));

        return emails.some(email => (email === value));
      });

      return data[index];
    }
  }
};
