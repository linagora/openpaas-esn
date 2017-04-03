'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnUserConfigurationService factory', function() {
  var $httpBackend, esnUserConfigurationService;
  var ESN_USER_CONFIGURATION_DEFAULT_MODULE;

  beforeEach(function() {
    module('esn.user-configuration');
  });

  beforeEach(inject(function(_$httpBackend_, _esnUserConfigurationService_, _ESN_USER_CONFIGURATION_DEFAULT_MODULE_) {
    $httpBackend = _$httpBackend_;

    esnUserConfigurationService = _esnUserConfigurationService_;
    ESN_USER_CONFIGURATION_DEFAULT_MODULE = _ESN_USER_CONFIGURATION_DEFAULT_MODULE_;
  }));

  describe('The get fn', function() {

    it('should send a POST request to /api/user/configuration', function(done) {
      $httpBackend.expectPOST('/api/user/configuration', [{ name: 'core' }]).respond([{ name: ESN_USER_CONFIGURATION_DEFAULT_MODULE, configurations: [] }]);

      esnUserConfigurationService.get().then(function(configurations) {
        expect(configurations).to.deep.equal([]);

        done();
      });
      $httpBackend.flush();
    });

    it('should support custom modules', function(done) {
      var module = 'linagora.esn.my-module';

      $httpBackend.expectPOST('/api/user/configuration', [{ name: module, keys: ['myKey'] }]).respond([{ name: module, configurations: [] }]);

      esnUserConfigurationService.get(['myKey'], module).then(function(configurations) {
        expect(configurations).to.deep.equal([]);

        done();
      });
      $httpBackend.flush();
    });

  });

  describe('The set fn', function() {

    it('should send a PUT request to /api/user/configuration', function() {
      $httpBackend.expectPUT('/api/user/configuration', [{ name: 'core', configurations: [] }]).respond(204);

      esnUserConfigurationService.set([]);
      $httpBackend.flush();
    });

    it('should support custom modules', function() {
      var configs = [{
            name: 'myKey',
            value: 'myValue'
          }],
          module = 'linagora.esn.my-module';

      $httpBackend.expectPUT('/api/user/configuration', [{ name: module, configurations: [{ name: 'myKey', value: 'myValue' }] }]).respond(204);
      esnUserConfigurationService.set(configs, module);
      $httpBackend.flush();
    });

  });
});
