'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnUserConfigurationService factory', function() {
  var $httpBackend, esnUserConfigurationService;
  var defaultModule;

  beforeEach(function() {
    angular.mock.module('esn.user-configuration');
  });

  beforeEach(inject(function(_$httpBackend_, _esnUserConfigurationService_, _ESN_USER_CONFIGURATION_DEFAULT_MODULE_) {
    esnUserConfigurationService = _esnUserConfigurationService_;
    $httpBackend = _$httpBackend_;
    defaultModule = _ESN_USER_CONFIGURATION_DEFAULT_MODULE_;
  }));

  describe('The get fn', function() {
    it('should send a POST request to /api/user/configuration', function(done) {
      var configs = [];

      $httpBackend.expectPOST('/api/user/configuration').respond([{ name: defaultModule, configurations: configs }]);
      esnUserConfigurationService.get().then(function(configurations) {
        expect(configurations).to.deep.equal(configs);
        done();
      });
      $httpBackend.flush();
    });
  });

  describe('The set fn', function() {
    it('should send a PUT request to /api/user/configuration', function() {
      var configs = [];

      $httpBackend.expectPUT('/api/user/configuration').respond(204);
      esnUserConfigurationService.set(configs);
      $httpBackend.flush();
    });
  });
});
