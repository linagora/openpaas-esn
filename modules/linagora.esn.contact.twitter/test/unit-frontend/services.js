'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The Contact Twitter services', function() {
  var TwitterContactHelper, contactTwitterAddressbookHelper;

  beforeEach(function() {
    angular.mock.module('esn.notification');
    angular.mock.module('linagora.esn.contact.twitter');
    angular.mock.inject(function(_TwitterContactHelper_, _contactTwitterAddressbookHelper_) {
      TwitterContactHelper = _TwitterContactHelper_;
      contactTwitterAddressbookHelper = _contactTwitterAddressbookHelper_;
    });
  });

  describe('The TwitterContactHelper service', function() {
    describe('The isTwitterContact fn', function() {

      it('should return false when input shell is undefined or null', function() {
        expect(TwitterContactHelper.isTwitterContact()).to.be.false;
        expect(TwitterContactHelper.isTwitterContact(null)).to.be.false;
      });

      it('should return false when input shell has no addressbook field', function() {
        expect(TwitterContactHelper.isTwitterContact({})).to.be.false;
      });

      it('should return true when addressbook type is twitter', function() {
        var shell = {
          addressbook: {
            type: 'twitter'
          }
        };

        expect(TwitterContactHelper.isTwitterContact(shell)).to.be.true;
      });
    });
  });

  describe('The contactTwitterAddressbookHelper service', function() {
    describe('The isTwitterContact fn', function() {

      it('should return false when input shell is undefined or null', function() {
        expect(contactTwitterAddressbookHelper.isTwitterAddressbook()).to.be.false;
        expect(contactTwitterAddressbookHelper.isTwitterAddressbook(null)).to.be.false;
      });

      it('should return false when input shell has no addressbook field', function() {
        expect(contactTwitterAddressbookHelper.isTwitterAddressbook({})).to.be.false;
      });

      it('should return true when type is twitter', function() {
        var shell = {
          type: 'twitter'
        };

        expect(contactTwitterAddressbookHelper.isTwitterAddressbook(shell)).to.be.true;
      });
    });
  });

});
