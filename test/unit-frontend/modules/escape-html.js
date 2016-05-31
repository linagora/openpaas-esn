'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Escape HTML module', function() {
  var escapeHtmlUtils;

  beforeEach(angular.mock.module('esn.escape-html'));
  beforeEach(angular.mock.inject(function(_escapeHtmlUtils_) {
    escapeHtmlUtils = _escapeHtmlUtils_;
  }));

  it('should escape all the html characters', function() {
    var html = '<h1 class="test" id=\'test\'>Title & Cat</h1>';
    expect(escapeHtmlUtils.escapeHTML(html)).to.equal('&lt;h1 class="test" id=\'test\'&gt;Title &amp; Cat&lt;/h1&gt;');
  });

  it('should unescape all the html characters', function() {
    var html = '<h1 class="test" id=\'test\'>Title & Cat</h1>';
    expect(escapeHtmlUtils.unescapeHTML('&lt;h1 class="test" id=\'test\'&gt;Title &amp; Cat&lt;/h1&gt;')).to.equal(html);
  });

  it('should be the same string after escape and unescape', function() {
    var html = '<h1 class="test" id=\'test\'>Title & Cat</h1>';
    expect(escapeHtmlUtils.unescapeHTML(escapeHtmlUtils.escapeHTML(html))).to.equal(html);
  });
});
