'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The Contact Twitter services', function() {

  describe('The TwitterContactHelper service', function() {
    var TwitterContactHelper;

    beforeEach(function() {
      angular.mock.module('esn.notification');
      angular.mock.module('linagora.esn.contact.twitter');
      angular.mock.inject(function(_TwitterContactHelper_) {
        TwitterContactHelper = _TwitterContactHelper_;
      });
    });

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

});
