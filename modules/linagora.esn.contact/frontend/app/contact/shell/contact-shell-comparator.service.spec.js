'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ContactShellComparator service', function() {

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(function() {
    inject(function(ContactShellComparator, $rootScope) {
      this.$rootScope = $rootScope;
      this.ContactShellComparator = ContactShellComparator;
    });
  });

  describe('The byDisplayName function', function() {

    var a = {
      displayName: 'Aa'
    };
    var b = {
      displayName: 'Abc'
    };

    var nonAlpha = {
      displayName: '#'
    };

    var thunder = {
      displayName: '⌁ YOLO ⌁'
    };

    var number = {
      displayName: '1'
    };

    var anonymousUser = {};

    it('should send back 1st contact when second param  does not have displayName attribute', function() {
      expect(this.ContactShellComparator.byDisplayName(a, anonymousUser)).to.equal(1);
    });

    it('should send back 2nd contact when first param  does not have displayName attribute', function() {
      expect(this.ContactShellComparator.byDisplayName(anonymousUser, b)).to.equal(-1);
    });

    it('should send back 1st when both params do not have displayName attribute', function() {
      expect(this.ContactShellComparator.byDisplayName(anonymousUser, anonymousUser)).to.equal(0);
    });

    it('should send back 1st contact when its fn is smaller', function() {
      expect(this.ContactShellComparator.byDisplayName(a, b)).to.equal(-1);
    });

    it('should send back 2nd contact when its fn is smaller', function() {
      expect(this.ContactShellComparator.byDisplayName(b, a)).to.equal(1);
    });

    it('should send back the first contact when fn are equal', function() {
      expect(this.ContactShellComparator.byDisplayName(a, a)).to.equal(0);
    });

    it('should send back non alpha one as the smaller', function() {
      expect(this.ContactShellComparator.byDisplayName(nonAlpha, a)).to.equal(-1);
      expect(this.ContactShellComparator.byDisplayName(thunder, a)).to.equal(-1);
    });

    it('should send equal when both are non alpha', function() {
      expect(this.ContactShellComparator.byDisplayName(nonAlpha, thunder)).to.equal(0);
    });

    it('should send number as smaller than alpha', function() {
      expect(this.ContactShellComparator.byDisplayName(number, a)).to.equal(-1);
    });

    it('should send equal between number and non alpha', function() {
      expect(this.ContactShellComparator.byDisplayName(number, nonAlpha)).to.equal(0);
    });
  });
});
