'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esn.summernote Angular module', function() {
  var fullLocale, esnI18nServiceMock, ESN_I18N_DEFAULT_FULL_LOCALE;

  esnI18nServiceMock = {
    getFullLocale: sinon.spy(function(cb) {
      return cb(fullLocale || ESN_I18N_DEFAULT_FULL_LOCALE);
    })
  };

  beforeEach(function() {
    angular.mock.module('esn.summernote-wrapper', function($provide) {
      $provide.value('esnI18nService', esnI18nServiceMock);
    });

    inject(function(_ESN_I18N_DEFAULT_FULL_LOCALE_) {
      ESN_I18N_DEFAULT_FULL_LOCALE = _ESN_I18N_DEFAULT_FULL_LOCALE_;
    });
  });

  describe('The summernote factory', function() {

    var summernote;

    it('should set the defaultFullLocale', function(done) {
      fullLocale = null;

      inject(function(_summernote_) {
        summernote = _summernote_;
      });

      expect(esnI18nServiceMock.getFullLocale).to.have.been.called;
      expect(summernote.options.lang).to.be.equal('en-US');
      done();
    });

    it('should return the setted fullLocale ', function(done) {
      fullLocale = 'fr-FR';

      inject(function(_summernote_) {
        summernote = _summernote_;
      });

      expect(esnI18nServiceMock.getFullLocale).to.have.been.called;
      expect(summernote.options.lang).to.be.equal('fr-FR');
      done();
    });
  });

  describe('The summernotePlugins factory', function() {

    var summernote, summernotePlugins;

    describe('The add function', function() {

      beforeEach(function() {
        inject(function(_summernote_, _summernotePlugins_) {
          summernote = _summernote_;
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
