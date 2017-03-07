'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.highlight Angular module', function() {

  beforeEach(function() {
    angular.mock.module('esn.highlight');
    angular.mock.module('esn.escape-html');
  });

  beforeEach(angular.mock.inject(function(_$filter_) {
    this.$filter = _$filter_;
  }));

  describe('The esnHighlight filter', function() {

    it('should filter text equal null by esnHighlight', function() {
      var nullMatch = this.$filter('esnHighlight')(null, 'a');
      expect(nullMatch).to.equal(null);
    });

    it('should filter text equal undefined by esnHighlight', function() {
      var undefinedMatch = this.$filter('esnHighlight')(undefined, 'a');
      expect(undefinedMatch).to.equal(undefined);
    });

    it('should filter text is empty by esnHighlight', function() {
      var contentContact = '';
      var empty = this.$filter('esnHighlight')(contentContact, 'a');
      expect(empty).to.equal('');
    });

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

    describe('ignoreEscape option', function() {
      it('should not highlight keyword inside a HTML tag', function() {
        var messageContent = 'cat <img title="cat">';
        var highlightedMessage = this.$filter('esnHighlight')(messageContent, 'cat', {ignoreEscape: true});

        expect(highlightedMessage.$$unwrapTrustedValue()).to.equal('<span class="highlight">cat</span> <img title="cat">');
      });

      it('should not highlight value of a HTML atribute', function() {
        var messageContent = '<img title="cat"/>';
        var highlightedMessage = this.$filter('esnHighlight')(messageContent, 'cat', {ignoreEscape: true});

        expect(highlightedMessage.$$unwrapTrustedValue()).to.equal('<img title="cat"/>');
      });

      it('should highlight keyword between 2 HTML components', function() {
        var messageContent = '<img name="cat"/> cat <a href="#cat"/>';
        var highlightedMessage = this.$filter('esnHighlight')(messageContent, 'cat', {ignoreEscape: true});

        expect(highlightedMessage.$$unwrapTrustedValue()).to.equal('<img name="cat"/> <span class="highlight">cat</span> <a href="#cat"/>');
      });

      it('should highlight keyword inside a nested HTML component', function() {
        var messageContent = '<a>img<img/></a>';
        var highlightedMessage = this.$filter('esnHighlight')(messageContent, 'img', {ignoreEscape: true});

        expect(highlightedMessage.$$unwrapTrustedValue()).to.equal('<a><span class="highlight">img</span><img/></a>');
      });

      it('should escape HTML with ignoreEscape option false', function() {
        var messageContent = 'img <a href="#"/>';
        var highlightedMessage = this.$filter('esnHighlight')(messageContent, 'img', {ignoreEscape: false});

        expect(highlightedMessage.$$unwrapTrustedValue()).to.equal('<span class="highlight">img</span> &lt;a href="#"/&gt;');
      });

      it('should escape HTML without ignoreEscape option', function() {
        var messageContent = 'img <a href="#"/>';
        var highlightedMessage = this.$filter('esnHighlight')(messageContent, 'img');

        expect(highlightedMessage.$$unwrapTrustedValue()).to.equal('<span class="highlight">img</span> &lt;a href="#"/&gt;');
      });
    });
  });
});
