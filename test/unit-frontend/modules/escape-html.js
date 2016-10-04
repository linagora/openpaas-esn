'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Escape HTML module', function() {

  beforeEach(angular.mock.module('esn.escape-html'));

  describe('The escapeHtmlUtils factory', function() {
    var escapeHtmlUtils;

    beforeEach(angular.mock.inject(function(_escapeHtmlUtils_) {
      escapeHtmlUtils = _escapeHtmlUtils_;
    }));

    describe('The escapeHTML function', function() {

      it('should return undefined when called with undefined', function() {
        expect(escapeHtmlUtils.escapeHTML()).to.equal(undefined);
      });

      it('should return null when called with null', function() {
        expect(escapeHtmlUtils.escapeHTML(null)).to.equal(null);
      });

      it('should return the empty string when called with an empty string', function() {
        expect(escapeHtmlUtils.escapeHTML('')).to.equal('');
      });

      it('should escape all the html characters', function() {
        var html = '<h1 class="test" id=\'test\'>Title & Cat</h1>';

        expect(escapeHtmlUtils.escapeHTML(html)).to.equal('&lt;h1 class="test" id=\'test\'&gt;Title &amp; Cat&lt;/h1&gt;');
      });

    });

    describe('The unescapeHTML function', function() {

      it('should unescape all the html characters', function() {
        var html = '<h1 class="test" id=\'test\'>Title & Cat</h1>';

        expect(escapeHtmlUtils.unescapeHTML('&lt;h1 class="test" id=\'test\'&gt;Title &amp; Cat&lt;/h1&gt;')).to.equal(html);
      });

      it('should be the same string after escape and unescape', function() {
        var html = '<h1 class="test" id=\'test\'>Title & Cat</h1>';

        expect(escapeHtmlUtils.unescapeHTML(escapeHtmlUtils.escapeHTML(html))).to.equal(html);
      });

    });

  });

  describe('The escapeHtml filter', function() {
    var filter;

    beforeEach(angular.mock.inject(function(escapeHtmlFilter) {
      filter = escapeHtmlFilter;
    }));

    it('should return undefined when called with undefined', function() {
      expect(filter()).to.equal(undefined);
    });

    it('should return null when called with null', function() {
      expect(filter(null)).to.equal(null);
    });

    it('should return the empty string when called with an empty string', function() {
      expect(filter('')).to.equal('');
    });

    it('should escape all the html characters', function() {
      expect(filter('<b>Bold &</b> <a>Link</a>')).to.equal('&lt;b&gt;Bold &amp;&lt;/b&gt; &lt;a&gt;Link&lt;/a&gt;');
    });

  });

});
