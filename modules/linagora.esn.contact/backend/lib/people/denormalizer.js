const ICAL = require('@linagora/ical.js');

module.exports = dependencies => {
  const { Person } = dependencies('people');

  return contact => {
    const vcard = new ICAL.Component(contact);
    const id = vcard.getFirstPropertyValue('uid');
    const fullName = vcard.getFirstPropertyValue('fn');
    const name = vcard.getFirstPropertyValue('n');
    const firstName = name ? name[1] : '';
    const lastName = name ? name[0] : '';
    const emails = getMultiValue(vcard, 'email').map(email => email.value.replace(/^mailto:/i, ''));
    const displayName = (fullName || `${firstName} ${lastName}`).trim();

    return Promise.resolve(new Person(id, 'contact', (emails && emails.length) ? emails[0] : '', displayName));
  };

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
