'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnI18nService service', function() {
  var $rootScope, $q, esnI18nService, EsnI18nString, preferredLanguage, ESN_I18N_DEFAULT_FULL_LOCALE, ESN_I18N_FULL_LOCALE;
  var $translateMock;

  beforeEach(function() {
    $translateMock = {};

    angular.mock.module('esn.i18n');
    angular.mock.module('esn.configuration');
    angular.mock.module(function($provide) {
      $provide.value('$translate', $translateMock);
      $provide.value('esnConfig', function(config, defaultValue) {
        return preferredLanguage ? $q.when(preferredLanguage) : $q.when(defaultValue);
      });
    });
  });

  beforeEach(inject(function(_$q_, _$rootScope_, _esnI18nService_, _EsnI18nString_, _ESN_I18N_DEFAULT_FULL_LOCALE_, _ESN_I18N_FULL_LOCALE_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    esnI18nService = _esnI18nService_;
    EsnI18nString = _EsnI18nString_;
    ESN_I18N_DEFAULT_FULL_LOCALE = _ESN_I18N_DEFAULT_FULL_LOCALE_;
    ESN_I18N_FULL_LOCALE = _ESN_I18N_FULL_LOCALE_;
  }));

  describe('The translate function', function() {
    it('should create a esnI18nEsnI18nString instance', function() {
      var result = esnI18nService.translate('Foo Bar');

      expect(result).to.be.an.instanceof(EsnI18nString);
    });

    it('should create a EsnI18nString instance with multiple params', function() {
      var result = esnI18nService.translate('Foo', 'Bar', 'Feng');

      expect(result).to.have.property('text', 'Foo');
      expect(result.params).to.shallowDeepEqual(['Bar', 'Feng']);
    });

    it('should return the object if input text is an instantce of EsnI18nString', function() {
      var translated = new EsnI18nString('Foo Bar');
      var output = esnI18nService.translate(translated);

      expect(output).to.equal(translated);
    });

    it('should returnt an error if input object is neither string or EsnI18nString', function() {
      function test() {
        esnI18nService.translate({text: 'Invalid Obj'});
      }

      expect(test).to.throw(TypeError);
    });
  });

  describe('The isI18nString function', function() {
    it('should return true if text is EsnI18nString', function() {
      var string = new EsnI18nString('i18n string');

      expect(esnI18nService.isI18nString(string)).to.be.true;
    });

    it('should return false if text is not EsnI18nString', function() {
      var string = 'normal string';

      expect(esnI18nService.isI18nString(string)).to.be.false;
    });
  });

  describe('The getLocale function', function() {
    it('should return the user browser locale if there is no used language key', function() {
      var preferredLanguage = 'fr';

      $translateMock.preferredLanguage = sinon.stub().returns(preferredLanguage);
      $translateMock.use = sinon.stub().returns();

      expect(esnI18nService.getLocale()).to.be.equal(preferredLanguage);
      expect($translateMock.use).to.have.been.calledOnce;
      expect($translateMock.preferredLanguage).to.have.been.calledOnce;
    });

    it('should return the currently used language key if it is set', function() {
      var preferredLanguage = 'fr';
      var usedLanguage = 'vi';

      $translateMock.preferredLanguage = sinon.stub().returns(preferredLanguage);
      $translateMock.use = sinon.stub().returns(usedLanguage);

      expect(esnI18nService.getLocale()).to.be.equal(usedLanguage);
      expect($translateMock.use).to.have.been.calledOnce;
      expect($translateMock.preferredLanguage).to.not.have.been.called;
    });
  });

  describe('The getFullLocale function', function() {
    it('should return the default Full locale if the user don\'t have a prefered language', function(done) {
      preferredLanguage = null;

      esnI18nService.getFullLocale().then(function(locale) {
        expect(locale).to.be.equal(ESN_I18N_DEFAULT_FULL_LOCALE);
        done();
      });

      $rootScope.$digest();
    });
    it('should return the user Full locale', function(done) {
      preferredLanguage = 'fr';

      esnI18nService.getFullLocale().then(function(locale) {
        expect(locale).to.be.equal(ESN_I18N_FULL_LOCALE[preferredLanguage]);
        done();
      });

      $rootScope.$digest();
    });
  });
});
