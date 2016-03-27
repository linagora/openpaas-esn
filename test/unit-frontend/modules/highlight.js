'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.highlight Angular module', function() {

  beforeEach(function() {
    angular.mock.module('esn.highlight');
  });

  beforeEach(angular.mock.inject(function(_$filter_) {
    this.$filter = _$filter_;
  }));

  describe('The esnHighlight filter', function() {
    it('should filter text without special chars by esnHighlight', function() {
      var contentContact = 'text results';
      var notContainSpecialChars = this.$filter('esnHighlight')(contentContact, 'u');
      expect(notContainSpecialChars.$$unwrapTrustedValue()).to.equal('text res<span class="highlight">u</span>lts');
    });

    it('should filter text with special chars by esnHighlight', function() {
      var contentContact = 'text results';
      var containSpecialChars = this.$filter('esnHighlight')(contentContact, 'text+results');
      expect(containSpecialChars.$$unwrapTrustedValue()).to.equal('<span class="highlight">text results</span>');
    });

    it('should filter text with no-match chars by esnHighlight', function() {
      var contentContact = 'text results';
      var noMatchChars = this.$filter('esnHighlight')(contentContact, 'a');
      expect(noMatchChars.$$unwrapTrustedValue()).to.equal('text results');
    });

    it('should filter text with matching words on multiple lines by esnHighlight', function() {
      var contentContact = 'text\n results';
      var matchingMultipleLines = this.$filter('esnHighlight')(contentContact, 'e');
      expect(matchingMultipleLines.$$unwrapTrustedValue()).to.equal('t<span class="highlight">e</span>xt\n r<span class="highlight">e</span>sults');
    });
  });
});
