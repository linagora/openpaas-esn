const OBJECT_TYPE = 'ldap';
const { PeopleResolver, Model } = require('../people');
const { search } = require('./index');

module.exports = new PeopleResolver(OBJECT_TYPE, resolver, denormalizer);

function resolver({ term, context, pagination }) {
  return search(context.user, { search: term, limit: pagination.limit }).then(result => result.list);
}

function denormalizer({ source }) {
  const email = new Model.EmailAddress({ value: source.preferredEmail, type: 'default' });
  const name = new Model.Name({ displayName: source.username });

  return Promise.resolve(
    new Model.Person({
      id: source._id,
      objectType: OBJECT_TYPE,
      emailAddresses: [email],
      names: [name]
    })
  );
}
