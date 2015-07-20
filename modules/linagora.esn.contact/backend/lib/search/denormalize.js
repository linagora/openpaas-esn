'use strict';

var Ical = require('ical.js');

module.exports = function(contact) {

  var result = {};
  if (contact.bookId) {
    result.bookId = contact.bookId;
  }
  if (contact.contactId) {
    result.contactId = contact.contactId;
  }

  if (!contact.vcard || !contact.vcard[1] || !contact.vcard[1].length) {
    return result;
  }

  var vcard = new Ical.Component(contact.vcard);

  function getMultiValue(propName) {
    var props = vcard.getAllProperties(propName);
    return props.map(function(prop) {
      var propVal = prop.getFirstValue();
      return { type: prop.getParameter('type'), value: propVal };
    });
  }

  function getMultiAddress(propName) {
    var props = vcard.getAllProperties(propName);
    return props.map(function(prop) {
      var propVal = prop.getFirstValue();
      return {
        full: propVal.join(' ').trim(),
        type: prop.getParameter('type'),
        street: propVal[2],
        city: propVal[3],
        zip: propVal[5],
        country: propVal[6]
      };
    });
  }

  result.uid = vcard.getFirstPropertyValue('uid');
  result.fn = vcard.getFirstPropertyValue('fn');

  var name = vcard.getFirstPropertyValue('n');
  result.name = name;
  result.firstName = name ? name[1] : '';
  result.lastName = name ? name[0] : '';

  result.emails = getMultiValue('email').map(function(mail) {
    mail.value = mail.value.replace(/^mailto:/i, '');
    return mail;
  });

  result.org = vcard.getFirstPropertyValue('org');
  result.urls = getMultiValue('url');

  result.socialprofiles = getMultiValue('socialprofile');
  result.nickname = vcard.getFirstPropertyValue('nickname');
  result.addresses = getMultiAddress('adr');

  return result;
};
