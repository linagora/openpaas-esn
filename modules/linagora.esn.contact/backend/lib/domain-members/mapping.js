const ICAL = require('@linagora/ical.js');

module.exports = dependencies => {
  const coreUserModule = dependencies('user');

  return {
    toVCard
  };

  function toVCard(user = {}, esnBaseUrl) {
    const vcard = new ICAL.Component('vcard');

    vcard.addPropertyWithValue('version', '4.0');
    vcard.addPropertyWithValue('uid', String(user._id));
    vcard.addPropertyWithValue('fn', coreUserModule.getDisplayName(user));

    const nValue = [];

    if (user.lastname) {
      nValue.push(user.lastname);
    }

    if (user.firstname) {
      nValue.push(user.firstname);
    }

    if (nValue.length) {
      vcard.addPropertyWithValue('n', nValue);
    }

    if (user.main_phone) {
      const prop = vcard.addPropertyWithValue('tel', user.main_phone);

      prop.setParameter('type', 'work');
    }

    if (user.emails && user.emails.length > 0) {
      user.emails.forEach(email => {
        const prop = vcard.addPropertyWithValue('email', email);

        prop.setParameter('type', 'work');
      });
    }

    if (user.service) {
      vcard.addPropertyWithValue('org', user.service);
    }

    if (user.job_title) {
      vcard.addPropertyWithValue('role', user.job_title);
    }

    if (user.building_location) {
      const prop = vcard.addPropertyWithValue('adr', ['', '', user.building_location]);

      prop.setParameter('type', 'work');
    }

    if (user.office_location) {
      const prop = vcard.addPropertyWithValue('adr', ['', '', user.office_location]);

      prop.setParameter('type', 'work');
    }

    if (user.description) {
      vcard.addPropertyWithValue('note', user.description);
    }

    if (esnBaseUrl) {
      vcard.addPropertyWithValue('photo', `${esnBaseUrl}/api/users/${user._id}/profile/avatar`);
    }

    const prop = new ICAL.Property('categories');

    prop.setValues(['Organization members']);
    vcard.addProperty(prop);

    return vcard;
  }
};
