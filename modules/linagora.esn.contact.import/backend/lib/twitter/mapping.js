'use strict';

var ICAL = require('ical.js');
var uuid = require('node-uuid');

module.exports = function() {

  function toVcard(json) {
    // See OR-1918 and https://dev.twitter.com/rest/reference/get/users/lookup
    var prop;
    var vcard = new ICAL.Component('vcard');

    vcard.addPropertyWithValue('version', '4.0');
    vcard.addPropertyWithValue('uid', uuid.v4());
    vcard.addPropertyWithValue('fn', json.name);
    var firstName = json.name.split(' ').slice(0, 1);
    var lastName = json.name.replace(firstName + ' ', '');
    vcard.addPropertyWithValue('n', [lastName, firstName]);
    vcard.addPropertyWithValue('photo', json.profile_image_url_https.replace('_normal.', '.'));
    vcard.addPropertyWithValue('note', json.description);
    var val = ['', '', '', '', '', '', json.location];
    prop = vcard.addPropertyWithValue('adr', val);
    prop.setParameter('type', 'Other');
    prop = vcard.addPropertyWithValue('socialprofile', '@' + json.screen_name);
    prop.setParameter('type', 'Twitter');
    vcard.addPropertyWithValue('url', json.url || '');
    prop = new ICAL.Property('categories');
    prop.setValues(['Twitter']);
    vcard.addProperty(prop);

    return vcard;
  }

  return {
    toVcard: toVcard
  };
};
