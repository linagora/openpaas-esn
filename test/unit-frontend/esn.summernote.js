'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.summernote Angular module', function() {
  var summernote;

  beforeEach(function() {
    angular.mock.module('esn.summernote-wrapper', function($provide) {
      $provide.value('summernote', summernote = { plugins: {} });
    });
  });

  describe('The summernotePlugins factory', function() {

    var summernotePlugins;

    describe('The add function', function() {

      beforeEach(function() {
        inject(function(_summernotePlugins_) {
          summernotePlugins = _summernotePlugins_;
        });
      });

      it('should register a new plugin to summernote.plugins', function() {
        summernotePlugins.add('myPlugin', { a: 'b' });

        expect(summernote.plugins.myPlugin).to.deep.equal({ a: 'b' });
      });

      it('should overwrite an existing plugin in summernote.plugins', function() {
        summernotePlugins.add('myPlugin', { a: 'b' });
        summernotePlugins.add('myPlugin', { c: 'd' });

        expect(summernote.plugins.myPlugin).to.deep.equal({ c: 'd' });
      });

    });

  });
});
