const PRIORITY = 100;
const { PeopleResolver, Model } = require('../people');
const { OBJECT_TYPE } = require('./constants');
const { denormalize } = require('./denormalize');
const { search } = require('./search');
const { getDisplayName } = require('./utils');
const { getPath } = require('./avatar');

module.exports = new PeopleResolver(OBJECT_TYPE, resolver, denormalizer, PRIORITY);

function resolver({ term, context, pagination }) {
  const options = { search: term, domains: [context.domain], limit: pagination.limit };

  return new Promise((resolve, reject) => {
    search(options, (err, result) => {
      if (err) {
        return reject(err);
      }

      result && result.list ? resolve(result.list) : resolve([]);
    });
  });
}

function denormalizer({ source }) {
  const denormalized = denormalize(source);

  const email = new Model.EmailAddress({ value: denormalized.preferredEmail, type: 'default' });
  const name = new Model.Name({ displayName: getDisplayName(source) });
  const photo = new Model.Photo({ url: getPath(source) });

  return Promise.resolve(
    new Model.Person({
      id: denormalized._id,
      objectType: OBJECT_TYPE,
      emailAddresses: [email],
      names: [name],
      photos: [photo]
    })
  );
}
