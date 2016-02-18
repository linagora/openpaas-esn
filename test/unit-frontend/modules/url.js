'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.url Angular module', function() {

  beforeEach(angular.mock.module('esn.url'));

  describe('The urlUtils service', function() {
    var urlUtils;

    beforeEach(function() {
      inject(function(_urlUtils_) {
        urlUtils = _urlUtils_;
      });
    });

    describe('The updateUrlParameter fn', function() {
      var DEFAULT_URL = 'http://linagora.com';
      var updateUrlParameter;

      beforeEach(function() {
        updateUrlParameter = urlUtils.updateUrlParameter;
      });

      it('should add parameter to URL', function() {
        var expectedUrl = DEFAULT_URL + '?key=value';
        expect(updateUrlParameter(DEFAULT_URL, 'key', 'value')).to.equal(expectedUrl);
      });

      it('should add parameter correctly when url already has parameters', function() {
        var inputUrl = DEFAULT_URL + '?x=1&y=2';
        var expectedUrl = DEFAULT_URL + '?x=1&y=2&z=3';
        expect(updateUrlParameter(inputUrl, 'z', '3')).to.equal(expectedUrl);
      });

      it('should update parameter to URL', function() {
        var inputUrl = DEFAULT_URL + '?key=value';
        var expectedUrl = DEFAULT_URL + '?key=otherValue';
        expect(updateUrlParameter(inputUrl, 'key', 'otherValue')).to.equal(expectedUrl);
      });

      it('should add parameter correctly when URL contains hash', function() {
        var inputUrl = DEFAULT_URL + '#contact';
        var expectedUrl = DEFAULT_URL + '?key=value#contact';
        expect(updateUrlParameter(inputUrl, 'key', 'value')).to.equal(expectedUrl);
      });

      it('should add parameter correctly when url already has parameters and hash', function() {
        var inputUrl = DEFAULT_URL + '?x=1&y=2#contact';
        var expectedUrl = DEFAULT_URL + '?x=1&y=2&z=3#contact';
        expect(updateUrlParameter(inputUrl, 'z', '3')).to.equal(expectedUrl);
      });

      it('should update parameter correctly when URL contains hash', function() {
        var inputUrl = DEFAULT_URL + '?key=value#contact';
        var expectedUrl = DEFAULT_URL + '?key=otherValue#contact';
        expect(updateUrlParameter(inputUrl, 'key', 'otherValue')).to.equal(expectedUrl);
      });

      it('should encode value before adding to parameter', function() {
        var expectedUrl = DEFAULT_URL + '?key=encode%20this';
        expect(updateUrlParameter(DEFAULT_URL, 'key', 'encode this')).to.equal(expectedUrl);
      });

    });

  });

  describe('The absoluteUrl factory', function() {

    var absoluteUrl;

    beforeEach(inject(function(_absoluteUrl_) {
      absoluteUrl = _absoluteUrl_;
    }));

    it('should return an absolute URL', function() {
      expect(absoluteUrl('/test')).to.match(/http[s]?:\/\/.+?\/test/);
    });

  });

});
