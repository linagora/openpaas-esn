const OBJECT_TYPE = 'ldap';
const { PeopleResolver, Person } = require('../people');
const { search } = require('./index');

module.exports = new PeopleResolver(OBJECT_TYPE, resolver, denormalizer);

function resolver({ term, context, pagination }) {
  return search(context.user, { search: term, limit: pagination.limit }).then(result => result.list);
}

function denormalizer(source) {
  return Promise.resolve(new Person(source._id, OBJECT_TYPE, source.preferredEmail, source.username));
}
