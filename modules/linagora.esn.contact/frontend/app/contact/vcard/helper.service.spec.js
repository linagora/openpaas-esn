'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The contactVcardHelper service', function() {
  var ICAL, CONTACT_ATTRIBUTES_ORDER, CONTACT_FALLBACK_ATTRIBUTE_TYPE, contactVcardHelper;

  beforeEach(module('linagora.esn.contact'));

  beforeEach(function() {
    inject(function(_contactVcardHelper_, _ICAL_, _CONTACT_ATTRIBUTES_ORDER_, _CONTACT_FALLBACK_ATTRIBUTE_TYPE_) {
      contactVcardHelper = _contactVcardHelper_;
      ICAL = _ICAL_;
      CONTACT_ATTRIBUTES_ORDER = _CONTACT_ATTRIBUTES_ORDER_;
      CONTACT_FALLBACK_ATTRIBUTE_TYPE = _CONTACT_FALLBACK_ATTRIBUTE_TYPE_;
    });
  });

  function buildFakeVcard() {
    var vcard = new ICAL.Component('vcard');

    vcard.addPropertyWithValue('version', '4.0');
    vcard.addPropertyWithValue('uid', '0');

    return vcard;
  }

  describe('The getMultiValue fn', function() {
    it('should return empty if there is no property', function() {
      var vcard = buildFakeVcard();

      var values = contactVcardHelper.getMultiValue(vcard, 'tel', CONTACT_ATTRIBUTES_ORDER.phone);

      expect(values).to.be.empty;
    });

    it('should return all properties', function() {
      var vcard = buildFakeVcard();
      var prop;

      prop = vcard.addPropertyWithValue('tel', '0101');
      prop.setParameter('type', 'Home');

      prop = vcard.addPropertyWithValue('tel', '0202');
      prop.setParameter('type', 'Work');

      var values = contactVcardHelper.getMultiValue(vcard, 'tel', CONTACT_ATTRIBUTES_ORDER.phone);

      expect(values).to.deep.equal([{
        value: '0101',
        type: 'Home'
      }, {
        value: '0202',
        type: 'Work'
      }]);
    });

    it('should use fallback type for unrecognized type', function() {
      var vcard = buildFakeVcard();
      var prop;

      prop = vcard.addPropertyWithValue('tel', '0101');
      prop.setParameter('type', 'Home');

      prop = vcard.addPropertyWithValue('tel', '0202');
      prop.setParameter('type', 'something unrecognized');

      var values = contactVcardHelper.getMultiValue(vcard, 'tel', CONTACT_ATTRIBUTES_ORDER.phone);

      expect(values).to.deep.equal([{
        value: '0101',
        type: 'Home'
      }, {
        value: '0202',
        type: CONTACT_FALLBACK_ATTRIBUTE_TYPE
      }]);
    });
  });

  describe('The getMultiAddress fn', function() {
    it('should return all addresses', function() {
      var vcard = buildFakeVcard();
      var prop;

      prop = vcard.addPropertyWithValue('adr', ['', '', 'Work Street', 'Work City', '', 'Work Zip', 'Work Country']);
      prop.setParameter('type', 'Work');

      prop = vcard.addPropertyWithValue('adr', ['', '', 'Home Street', 'Home City', '', 'Home Zip', 'Home Country']);
      prop.setParameter('type', 'Home');

      var addresses = contactVcardHelper.getMultiAddress(vcard, 'adr', CONTACT_ATTRIBUTES_ORDER.address);

      expect(addresses).to.deep.equal([{
        type: 'Work',
        street: 'Work Street',
        city: 'Work City',
        zip: 'Work Zip',
        country: 'Work Country'
      }, {
        type: 'Home',
        street: 'Home Street',
        city: 'Home City',
        zip: 'Home Zip',
        country: 'Home Country'
      }]);
    });

    it('should use fallback type for unrecognized type', function() {
      var vcard = buildFakeVcard();
      var prop;

      prop = vcard.addPropertyWithValue('adr', ['', '', 'Work Street', 'Work City', '', 'Work Zip', 'Work Country']);
      prop.setParameter('type', 'Work');

      prop = vcard.addPropertyWithValue('adr', ['', '', 'NobodyHome Street', 'NobodyHome City', '', 'NobodyHome Zip', 'NobodyHome Country']);
      prop.setParameter('type', 'NobodyHome');

      var addresses = contactVcardHelper.getMultiAddress(vcard, 'adr', CONTACT_ATTRIBUTES_ORDER.address);

      expect(addresses).to.deep.equal([{
        type: 'Work',
        street: 'Work Street',
        city: 'Work City',
        zip: 'Work Zip',
        country: 'Work Country'
      }, {
        type: CONTACT_FALLBACK_ATTRIBUTE_TYPE,
        street: 'NobodyHome Street',
        city: 'NobodyHome City',
        zip: 'NobodyHome Zip',
        country: 'NobodyHome Country'
      }]);
    });
  });
});
