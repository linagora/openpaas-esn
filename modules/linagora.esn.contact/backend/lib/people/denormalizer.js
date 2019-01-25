const ICAL = require('@linagora/ical.js');

module.exports = dependencies => {
  const { Model } = dependencies('people');

  return ({ source }) => {
    const vcard = new ICAL.Component(source.body);
    const id = vcard.getFirstPropertyValue('uid');
    const fullName = vcard.getFirstPropertyValue('fn');
    const name = vcard.getFirstPropertyValue('n');
    const firstName = name ? name[1] : '';
    const lastName = name ? name[0] : '';
    const emails = getMultiValue(vcard, 'email').map(email => {
      email.value = email.value.replace(/^mailto:/i, '');

      return email;
    });
    const displayName = (fullName || `${firstName} ${lastName}`).trim();
    const emailAddresses = emails.map(email => new Model.EmailAddress({ value: email.value, type: email.type }));
    const names = [new Model.Name({ displayName })];
    const photos = [new Model.Photo({ url: getAvatarPath(source) })];

    return Promise.resolve(
      new Model.Person({
        id,
        objectType: 'contact',
        emailAddresses,
        names,
        photos
      })
    );
  };

  function getAvatarPath(source) {
    return `contact/api/contacts/${source.bookId}/${source.bookName}/${source.contactId}/avatar`;
  }

  function getMultiValue(vcard, propName) {
    var props = vcard.getAllProperties(propName);

    return props.map(prop => {
      const data = { value: prop.getFirstValue() };
      const type = prop.getFirstParameter('type');

      if (type) {
        data.type = type;
      }

      return data;
    });
  }
};
