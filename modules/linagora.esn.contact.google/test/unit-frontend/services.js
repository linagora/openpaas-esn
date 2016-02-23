'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The Contact Google services', function() {

  describe('The GoogleContactHelper service', function() {
    var GoogleContactHelper;

    beforeEach(function() {
      angular.mock.module('esn.notification');
      angular.mock.module('linagora.esn.contact.google');
      angular.mock.inject(function(_GoogleContactHelper_) {
        GoogleContactHelper = _GoogleContactHelper_;
      });
    });

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

});
