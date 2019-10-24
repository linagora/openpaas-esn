const { PeopleResolver } = require('../../people');
const { FIELD_TYPES } = require('../../people/constants');
const { OBJECT_TYPE } = require('../constants');
const { findByEmail } = require('../index');
const denormalizer = require('./denormalizer');
const PRIORITY = 100;

module.exports = new PeopleResolver(OBJECT_TYPE, resolver, denormalizer, PRIORITY);

function resolver({ fieldType, value, context }) {
  if (fieldType === FIELD_TYPES.EMAIL_ADDRESS) {
    return new Promise((resolve, reject) => {
      findByEmail(value, { domainId: context.domain._id}, (err, user) => {
        if (err) return reject(err);

        resolve(user);
      });
    });
  }

  return Promise.resolve();
}
