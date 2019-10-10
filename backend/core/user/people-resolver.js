const PRIORITY = 100;
const { PeopleResolver, Model } = require('../people');
const { OBJECT_TYPE } = require('./constants');
const { denormalize } = require('./denormalize');
const { search } = require('./search');
const { getDisplayName } = require('./utils');
const { getPath } = require('./avatar');
const { filterDomainsByMembersCanBeSearched } = require('../domain/helpers');

module.exports = new PeopleResolver(OBJECT_TYPE, resolver, denormalizer, PRIORITY);

function resolver({ term, context, pagination, excludes }) {
  return new Promise((resolve, reject) => {
    filterDomainsByMembersCanBeSearched([context.domain])
      .then(domains => {
        if (!domains.length) {
          return resolve([]);
        }

        search({ search: term, domains, limit: pagination.limit, excludeUserIds: excludes.map(tuple => tuple.id).filter(Boolean) }, (err, result) => {
          if (err) {
            return reject(err);
          }

          result && result.list ? resolve(result.list) : resolve([]);
        });
      });
  });
}

function denormalizer({ source }) {
  const denormalized = denormalize(source);

  const email = new Model.EmailAddress({ value: denormalized.preferredEmail, type: 'default' });
  const name = new Model.Name({ displayName: getDisplayName(source) });
  const photo = new Model.Photo({ url: getPath(source) });
  const phone = source.main_phone ? new Model.PhoneNumber({ value: source.main_phone }) : undefined;

  return Promise.resolve(
    new Model.Person({
      id: denormalized._id,
      objectType: OBJECT_TYPE,
      emailAddresses: [email],
      phoneNumbers: phone ? [phone] : [],
      names: [name],
      photos: [photo]
    })
  );
}
