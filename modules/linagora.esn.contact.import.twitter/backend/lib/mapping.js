'use strict';

var ICAL = require('@linagora/ical.js');
var trim = require('trim');

module.exports = function() {

  function toVcard(json) {
    // See OR-1918 and https://dev.twitter.com/rest/reference/get/users/lookup
    var prop;
    var vcard = new ICAL.Component('vcard');

    vcard.addPropertyWithValue('version', '4.0');
    vcard.addPropertyWithValue('uid', json.id_str);

    var name = trim(json.name).replace(/\s+/g, ' ');
    vcard.addPropertyWithValue('fn', name);

    var words = name.split(' ');
    var firstName = words[0];
    var lastName = words.slice(1).join(' ');
    vcard.addPropertyWithValue('n', [lastName, firstName]);

    vcard.addPropertyWithValue('photo', json.profile_image_url_https.replace('_normal.', '.'));

    if (json.description) {
      vcard.addPropertyWithValue('note', json.description);
    }

    var street = json.location || '';
    var country = json.withheld_in_countries || '';
    if (street || country) {
      prop = vcard.addPropertyWithValue('adr', ['', '', street, '', '', '', country]);
      prop.setParameter('type', 'Other');
    }

    prop = vcard.addPropertyWithValue('socialprofile', '@' + json.screen_name);
    prop.setParameter('type', 'Twitter');

    if (json.url) {
      vcard.addPropertyWithValue('url', json.url);
    }

    prop = new ICAL.Property('categories');
    prop.setValues(['Twitter']);
    vcard.addProperty(prop);

    return vcard;
  }

  return {
    toVcard: toVcard
  };
};
