'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The Contact Google services', function() {
  var GoogleContactHelper, contactGoogleAddressbookHelper;

  beforeEach(function() {
    module('esn.notification');
    module('linagora.esn.contact.google');
    inject(function(_GoogleContactHelper_, _contactGoogleAddressbookHelper_) {
      GoogleContactHelper = _GoogleContactHelper_;
      contactGoogleAddressbookHelper = _contactGoogleAddressbookHelper_;
    });
  });

  describe('The GoogleContactHelper service', function() {
    describe('The isGoogleContact fn', function() {
      it('should return false when input shell is undefined or null', function() {
        expect(GoogleContactHelper.isGoogleContact()).to.be.false;
        expect(GoogleContactHelper.isGoogleContact(null)).to.be.false;
      });

      it('should return false when input shell has no addressbook field', function() {
        expect(GoogleContactHelper.isGoogleContact({})).to.be.false;
      });

      it('should return true when addressbook type is google', function() {
        var shell = {
          addressbook: {
            type: 'google'
          }
        };

        expect(GoogleContactHelper.isGoogleContact(shell)).to.be.true;
      });
    });
  });

  describe('The contactGoogleAddressbookHelper service', function() {
    describe('The isGoogleAddressbook fn', function() {
      it('should return false when input shell is undefined or null', function() {
        expect(contactGoogleAddressbookHelper.isGoogleAddressbook()).to.be.false;
        expect(contactGoogleAddressbookHelper.isGoogleAddressbook(null)).to.be.false;
      });

      it('should return false when input shell has no addressbook field', function() {
        expect(contactGoogleAddressbookHelper.isGoogleAddressbook({})).to.be.false;
      });

      it('should return true when addressbook type is google', function() {
        var shell = {
          type: 'google'
        };

        expect(contactGoogleAddressbookHelper.isGoogleAddressbook(shell)).to.be.true;
      });
    });
  });

});
