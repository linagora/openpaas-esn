'use strict';

var ICAL = require('@linagora/ical.js');

module.exports = function() {

  function getFormattedName(json) {
    if (json.title[0]) {
      return json.title[0];
    }
    if (json['gd:name']) {
      return json['gd:name'][0]['gd:fullName'][0];
    }
    if (json['gd:organization']) {
      if (json['gd:organization'][0]['gd:orgName']) {
        return json['gd:organization'][0]['gd:orgName'][0];
      }
      if (json['gd:organization'][0]['gd:orgTitle']) {
        return json['gd:organization'][0]['gd:orgTitle'][0];
      }
    }
    if (json['gContact:nickname']) {
      return json['gContact:nickname'][0];
    }
    if (json['gd:email']) {
      return json['gd:email'][0].$.address.replace('mailto:', '');
    }
    if (json['gd:phoneNumber']) {
      return json['gd:phoneNumber'][0].$.uri.replace('tel:', '');
    }
  }

  function getMultiValueType(data) {
    return data.split('#').pop();
  }

  function hasValue(data) {
    return (data && data[0]) ? data[0] : '';
  }

  function toVcard(json) {
    // See https://developers.google.com/google-apps/contacts/v3/#retrieving_a_single_contact
    // and test/unit-backend/lib/mapping.js for json sample
    var prop;
    var fn, name;
    var vcard = new ICAL.Component('vcard');

    vcard.addPropertyWithValue('version', '4.0');
    var uid = json.id[0].split('/').pop();
    vcard.addPropertyWithValue('uid', uid);
    fn = getFormattedName(json);
    vcard.addPropertyWithValue('fn', fn);
    if (json['gd:name']) {
      name = json['gd:name'][0]['gd:fullName'][0];
      var words = name.split(' ');
      var firstName = words[0];
      var lastName = words.slice(1).join(' ');
      vcard.addPropertyWithValue('n', [lastName, firstName]);
    }

    if (json['gd:phoneNumber']) {
      json['gd:phoneNumber'].forEach(function(data) {
        if (data.$ && data.$.uri && data.$.rel) {
          var prop = vcard.addPropertyWithValue('tel', data.$.uri);
          prop.setParameter('type', getMultiValueType(data.$.rel));
        }
      });
    }

    if (json['gd:structuredPostalAddress']) {
      json['gd:structuredPostalAddress'].forEach(function(data) {
        var val = ['', '', hasValue(data['gd:street']), hasValue(data['gd:city']), '', hasValue(data['gd:postcode']), hasValue(data['gd:country'])];
        var prop = vcard.addPropertyWithValue('adr', val);
        prop.setParameter('type', getMultiValueType(data.$.rel));
      });
    }

    if (json['gd:email']) {
      json['gd:email'].forEach(function(data) {
        if (data.$ && data.$.address && data.$.rel) {
          var prop = vcard.addPropertyWithValue('email', data.$.address);
          prop.setParameter('type', getMultiValueType(data.$.rel));
        }
      });
    }

    if (json['gd:im']) {
      json['gd:im'].forEach(function(data) {
        if (data.$ && data.$.address && data.$.protocol) {
          var prop = vcard.addPropertyWithValue('socialprofile', data.$.address);
          prop.setParameter('type', getMultiValueType(data.$.protocol));
        }
      });
    }

    if (json['gd:organization']) {
      if (json['gd:organization'][0]['gd:orgName']) {
        vcard.addPropertyWithValue('org', json['gd:organization'][0]['gd:orgName'][0]);
      }
      if (json['gd:organization'][0]['gd:orgTitle']) {
        vcard.addPropertyWithValue('role', json['gd:organization'][0]['gd:orgTitle'][0]);
      }
    }

    if (json['gContact:birthday']) {
      vcard.addPropertyWithValue('bday', json['gContact:birthday'][0].$.when);
    }

    if (json['gContact:nickname']) {
      vcard.addPropertyWithValue('nickname', json['gContact:nickname'][0]);
    }

    if (json['gContact:website']) {
      json['gContact:website'].forEach(function(data) {
        if (data.$) {
          vcard.addPropertyWithValue('url', data.$.href);
        }
      });
    }

    if (json.contactPhoto) {
      vcard.addPropertyWithValue('photo', json.contactPhoto);
    }

    prop = new ICAL.Property('categories');
    prop.setValues(['Google']);
    vcard.addProperty(prop);

    return vcard;
  }

  return {
    toVcard: toVcard
  };
};
