const OBJECT_TYPE = 'ldap';
const PeopleSearcher = require('../people/searcher');
const Model = require('../people/model');
const { search } = require('./index');
const { getDisplayName } = require('../user');

module.exports = new PeopleSearcher(OBJECT_TYPE, searcher, denormalizer);

function searcher({ term, context, pagination }) {
  return search(context.user, { search: term, limit: pagination.limit }).then(result => result.list);
}

function denormalizer({ source }) {
  const email = new Model.EmailAddress({ value: source.preferredEmail, type: 'default' });
  const name = new Model.Name({ displayName: getDisplayName(source) });
  const phone = source.main_phone ? new Model.PhoneNumber({ value: source.main_phone }) : undefined;

  return Promise.resolve(
    new Model.Person({
      id: source._id,
      objectType: OBJECT_TYPE,
      emailAddresses: [email],
      phoneNumbers: phone ? [phone] : [],
      names: [name]
    })
  );
}
