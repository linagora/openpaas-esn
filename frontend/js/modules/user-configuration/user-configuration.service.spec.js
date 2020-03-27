'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnUserConfigurationService factory', function() {
  var $rootScope, esnConfigApi, esnUserConfigurationService;
  var ESN_USER_CONFIGURATION_DEFAULT_MODULE;

  beforeEach(function() {
    module('esn.user-configuration');
  });

  beforeEach(inject(function(_$rootScope_, _esnConfigApi_, _esnUserConfigurationService_, _ESN_USER_CONFIGURATION_DEFAULT_MODULE_) {
    $rootScope = _$rootScope_;
    esnConfigApi = _esnConfigApi_;
    esnUserConfigurationService = _esnUserConfigurationService_;
    ESN_USER_CONFIGURATION_DEFAULT_MODULE = _ESN_USER_CONFIGURATION_DEFAULT_MODULE_;
  }));

  describe('The get fn', function() {
    it('should call esnConfigApi to get config', function(done) {
      var keys = ['a config key'];

      esnConfigApi.getUserConfigurations = sinon.stub().returns($q.when([{
        name: ESN_USER_CONFIGURATION_DEFAULT_MODULE,
        configurations: []
      }]));

      esnUserConfigurationService
        .get(keys)
        .then(function(configurations) {
          expect(configurations).to.deep.equal([]);
          expect(esnConfigApi.getUserConfigurations).to.have.been.calledWith([{
            name: ESN_USER_CONFIGURATION_DEFAULT_MODULE,
            keys: keys
          }]);
          done();
        });

      $rootScope.$digest();
    });

    it('should support custom modules', function(done) {
      var module = 'linagora.esn.my-module';
      var keys = ['a config key'];

      esnConfigApi.getUserConfigurations = sinon.stub().returns($q.when([{
        name: module,
        configurations: []
      }]));

      esnUserConfigurationService
        .get(keys, module)
        .then(function(configurations) {
          expect(configurations).to.deep.equal([]);
          expect(esnConfigApi.getUserConfigurations).to.have.been.calledWith([{
            name: module,
            keys: keys
          }]);
          done();
        });

      $rootScope.$digest();
    });

    it('should call esnConfigApi to get config of a specific user', function(done) {
      var module = 'linagora.esn.my-module';
      var keys = ['a config key'];
      var userId = 'a';

      esnConfigApi.getUserConfigurations = sinon.stub().returns($q.when([{
        name: module,
        configurations: []
      }]));

      esnUserConfigurationService
        .get(keys, module, userId)
        .then(function(configurations) {
          expect(configurations).to.deep.equal([]);
          expect(esnConfigApi.getUserConfigurations).to.have.been.calledWith([{
            name: module,
            keys: keys
          }], userId);
          done();
        });

      $rootScope.$digest();
    });
  });

  describe('The set fn', function() {

    it('should call esnConfigApi to set configs', function(done) {
      var configurations = [{
        name: 'a config',
        value: 'a value'
      }];

      esnConfigApi.setUserConfigurations = sinon.stub().returns($q.when());

      esnUserConfigurationService
        .set(configurations)
        .then(function() {
          expect(esnConfigApi.setUserConfigurations).to.have.been.calledWith([{
            name: ESN_USER_CONFIGURATION_DEFAULT_MODULE,
            configurations: configurations
          }]);
          done();
        });

      $rootScope.$digest();
    });

    it('should support custom modules', function(done) {
      var configurations = [{
        name: 'a config',
        value: 'a value'
      }];
      var module = 'a module';

      esnConfigApi.setUserConfigurations = sinon.stub().returns($q.when());

      esnUserConfigurationService
        .set(configurations, module)
        .then(function() {
          expect(esnConfigApi.setUserConfigurations).to.have.been.calledWith([{
            name: module,
            configurations: configurations
          }]);
          done();
        });

      $rootScope.$digest();
    });
  });
});
