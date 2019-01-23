const { PeopleResolver, Person } = require('../people');
const { OBJECT_TYPE } = require('./constants');
const { denormalize } = require('./denormalize');
const { search } = require('./search');
const { getDisplayName } = require('./utils');

module.exports = new PeopleResolver(OBJECT_TYPE, resolver, denormalizer);

function resolver({ term, context }) {
  const options = { search: term, domains: [] };

  return new Promise((resolve, reject) => {
    search(options, (err, result) => {
      if (err) {
        return reject(err);
      }

      result && result.list ? resolve(result.list) : resolve([]);
    });
  });
}

function denormalizer(source) {
  const denormalized = denormalize(source);

  return Promise.resolve(new Person(denormalized._id, OBJECT_TYPE, denormalized.preferredEmail, getDisplayName(source)));
}
