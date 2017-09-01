'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnI18nLoader service', function() {
  var $httpBackend, $rootScope;
  var esnI18nLoader;

  beforeEach(function() {
    angular.mock.module('esn.i18n');
  });

  beforeEach(inject(function(_$rootScope_, _$httpBackend_, _esnI18nLoader_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    esnI18nLoader = _esnI18nLoader_;
  }));

  it('should load the desired catalog indicating by options.key', function(done) {
    var catalogs = {
      en: { hello: 'hello' },
      vi: { hello: 'xin chao' }
    };
    var options = { key: 'vi' };

    $httpBackend.expectGET('/api/i18n').respond(catalogs);

    esnI18nLoader(options).then(function(catalog) {
      expect(catalog).to.deep.equal(catalogs.vi);
      done();
    });

    $httpBackend.flush();
  });

  it('should reject when the desired catalog not found', function(done) {
    var catalogs = {
      en: { hello: 'hello' },
      vi: { hello: 'xin chao' }
    };
    var options = { key: 'fr' };

    $httpBackend.expectGET('/api/i18n').respond(catalogs);

    esnI18nLoader(options).catch(function(err) {
      expect(err.message).to.equal('No catalog found for fr');
      done();
    });

    $httpBackend.flush();
  });

  it('should cache the catalogs to not issue HTTP request again on next calls', function(done) {
    var catalogs = {
      en: { hello: 'hello' },
      vi: { hello: 'xin chao' }
    };
    var options = { key: 'vi' };

    $httpBackend.expectGET('/api/i18n').respond(catalogs);
    esnI18nLoader(options);
    $httpBackend.flush();

    esnI18nLoader(options).then(function(catalog) {
      expect(catalog).to.deep.equal(catalogs.vi);
      done();
    });

    $rootScope.$digest();
  });
});
