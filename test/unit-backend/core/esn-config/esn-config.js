'use strict';

const q = require('q');
const sinon = require('sinon');
const mockery = require('mockery');
const expect = require('chai').expect;

describe('The core/esn-config/esn-config.js module', function() {

  const DOMAIN_ID = 'domain123';
  const MODULE_NAME = 'some_module';
  var esnConfig;
  var confModuleMock, fallbackModuleMock;

  beforeEach(function() {
    confModuleMock = {};
    fallbackModuleMock = {};

    mockery.registerMock('../configuration', confModuleMock);
    mockery.registerMock('./fallback', fallbackModuleMock);

    var EsnConfig = this.helpers.requireBackend('core/esn-config/esn-config');

    esnConfig = new EsnConfig(MODULE_NAME, DOMAIN_ID);
  });

  function createConfiguration(moduleName, configs, domainId) {
    return {
      domain_id: domainId || DOMAIN_ID,
      modules: [{
        name: moduleName,
        configurations: configs
      }]
    };
  }

  describe('The constructor', function() {

    it('should return an instance of EsnConfig with moduleName and domainId', function() {
      expect(esnConfig.moduleName).to.equal(MODULE_NAME);
      expect(esnConfig.domainId).to.equal(DOMAIN_ID);
    });

  });

  describe('The getMultiple method', function() {

    it('should resolve an array of found configurations and not-found configurations with empty value', function(done) {
      var config1 = {
        name: 'key1',
        value: 'val1'
      };
      var config2 = {
        name: 'key2',
        value: 'val2'
      };

      fallbackModuleMock.getConfiguration = sinon.stub().returns(q(createConfiguration(MODULE_NAME, [config1, config2])));

      esnConfig.getMultiple(['key1', 'key2', 'key3']).then(function(data) {
        expect(fallbackModuleMock.getConfiguration).to.have.been.calledWith(DOMAIN_ID);
        expect(data).to.deep.equal([config1, config2, { name: 'key3' }]);
        done();
      }, done.bind(null, 'should resolve'));
    });

    it('should resolve an array with empty value if no configuration found', function(done) {
      fallbackModuleMock.getConfiguration = sinon.stub().returns(q(createConfiguration(MODULE_NAME, [])));

      esnConfig.getMultiple(['key1', 'key2', 'key3']).then(function(data) {
        expect(data).to.deep.equal([{ name: 'key1' }, { name: 'key2' }, { name: 'key3' }]);
        done();
      }, done.bind(null, 'should resolve'));
    });

    it('should resolve an array with empty value if no configuration document found from database', function(done) {
      fallbackModuleMock.getConfiguration = sinon.stub().returns(q(null));

      esnConfig.getMultiple(['key1', 'key2', 'key3']).then(function(data) {
        expect(data).to.deep.equal([{ name: 'key1' }, { name: 'key2' }, { name: 'key3' }]);
        done();
      }, done.bind(null, 'should resolve'));
    });

    it('should resolve an array with empty value if corressponding module is not found', function(done) {
      var config1 = {
        name: 'key1',
        value: 'val1'
      };
      var config2 = {
        name: 'key2',
        value: 'val2'
      };

      fallbackModuleMock.getConfiguration = sinon.stub().returns(q(createConfiguration('another_module'), [config1, config2]));

      esnConfig.getMultiple(['key1', 'key2', 'key3']).then(function(data) {
        expect(data).to.deep.equal([{ name: 'key1' }, { name: 'key2' }, { name: 'key3' }]);
        done();
      }, done.bind(null, 'should resolve'));
    });

    it('should reject if there is error while getting configuration from database', function(done) {
      fallbackModuleMock.getConfiguration = sinon.stub().returns(q.reject(new Error('some_error')));

      esnConfig.getMultiple(['key1', 'key2', 'key3'])
        .then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal('some_error');
          done();
        });
    });

  });

  describe('The get method', function() {

    it('should resolve a single configuration if found', function(done) {
      var config1 = {
        name: 'key1',
        value: 'val1'
      };
      var config2 = {
        name: 'key2',
        value: 'val2'
      };

      fallbackModuleMock.getConfiguration = sinon.stub().returns(q(createConfiguration(MODULE_NAME, [config1, config2])));

      esnConfig.get(config1.name).then(function(data) {
        expect(data).to.equal(config1.value);
        done();
      }, done.bind(null, 'should resolve'));
    });

    it('should resolve a single configuration if found even it is falsy', function(done) {
      var config1 = {
        name: 'key1',
        value: false
      };
      var config2 = {
        name: 'key2',
        value: 'val2'
      };

      fallbackModuleMock.getConfiguration = sinon.stub().returns(q(createConfiguration(MODULE_NAME, [config1, config2])));

      esnConfig.get(config1.name).then(function(data) {
        expect(data).to.equal(config1.value);
        done();
      }, done.bind(null, 'should resolve'));
    });

    it('should resolve undefined if no configuration found', function(done) {
      var config1 = {
        name: 'key1',
        value: 'val1'
      };
      var config2 = {
        name: 'key2',
        value: 'val2'
      };

      fallbackModuleMock.getConfiguration = sinon.stub().returns(q(createConfiguration(MODULE_NAME, [config1, config2])));

      esnConfig.get('key3').then(function(data) {
        expect(data).to.not.be.defined;
        done();
      }, done.bind(null, 'should resolve'));
    });

  });

  describe('The setMultiple method', function() {

    it('should update the corressponding configuration', function(done) {
      var config1 = {
        name: 'key1',
        value: 'val1'
      };
      var config2 = {
        name: 'key2',
        value: 'val2'
      };
      var config1Updated = {
        name: config1.name,
        value: 'new value'
      };

      confModuleMock.findConfiguration = function(domainId, userId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(null, createConfiguration(MODULE_NAME, [config1, config2]));
      };

      confModuleMock.update = function(configuration, callback) {
        expect(configuration).to.deep.equal(createConfiguration(MODULE_NAME, [config1Updated, config2]));
        expect(callback).to.be.a.function;

        callback();
      };

      esnConfig.setMultiple([config1Updated]).then(done.bind(null, null), done.bind(null, 'should resolve'));
    });

    it('should update the corressponding configuration with key and value', function(done) {
      var config1 = {
        name: 'key1',
        value: { key: 'val1' }
      };
      var config2 = {
        name: 'key2',
        value: 'val2'
      };
      var config1Updated = {
        name: config1.name,
        value: { key: 'new value' }
      };

      confModuleMock.findConfiguration = function(domainId, userId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(null, createConfiguration(MODULE_NAME, [config1, config2]));
      };

      confModuleMock.update = function(configuration, callback) {
        expect(configuration).to.deep.equal(createConfiguration(MODULE_NAME, [config1Updated, config2]));
        expect(callback).to.be.a.function;

        callback();
      };

      esnConfig.setMultiple([{
        name: config1.name,
        value: 'new value',
        key: 'key'
      }]).then(done.bind(null, null), done.bind(null, 'should resolve'));
    });

    it('should create new configuration if no configuration found from database', function(done) {
      var config = {
        name: 'key',
        value: 'value'
      };

      confModuleMock.findConfiguration = function(domainId, userId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(null, null);
      };

      confModuleMock.update = function(configuration, callback) {
        expect(configuration).to.deep.equal(createConfiguration(MODULE_NAME, [config]));
        expect(callback).to.be.a.function;

        callback();
      };

      esnConfig.setMultiple([config]).then(done.bind(null, null), done.bind(null));
    });

    it('should create new module if corressponding module is not found', function(done) {
      var config = {
        name: 'key',
        value: 'value'
      };

      confModuleMock.findConfiguration = function(domainId, userId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(null, {
          modules: [{
            name: 'another_module',
            configurations: []
          }]
        });
      };

      confModuleMock.update = function(configuration, callback) {
        expect(configuration).to.deep.equal({
          modules: [{
            name: MODULE_NAME,
            configurations: [config]
          }, {
            name: 'another_module',
            configurations: []
          }]
        });
        expect(callback).to.be.a.function;

        callback();
      };

      esnConfig.setMultiple([config]).then(done.bind(null, null), done.bind(null));
    });

  });

  describe('The getConfigsFromAllDomains method', function() {

    it('should resolve an array of configrations from all domains', function(done) {
      var configName = 'name';
      var config1 = {
        name: configName,
        value: 'val1'
      };
      var config2 = {
        name: configName,
        value: 'val2'
      };
      var config3 = {
        name: configName,
        value: false
      };

      confModuleMock.getAll = function(callback) {
        callback(null, [
          createConfiguration(MODULE_NAME, [config1], 'domain1'),
          createConfiguration(MODULE_NAME, [config2], 'domain2'),
          createConfiguration(MODULE_NAME, [config3], 'domain3')
        ]);
      };

      esnConfig.getConfigsFromAllDomains(configName).then(function(data) {
        expect(data).to.deep.equal([{
          domainId: 'domain1',
          config: config1.value
        }, {
          domainId: 'domain2',
          config: config2.value
        }, {
          domainId: 'domain3',
          config: config3.value
        }]);
        done();
      }, done.bind(null, 'should resolve'));
    });

    it('should resolve an emtpy array if it fails to get configurations from database', function(done) {
      var configName = 'name';

      confModuleMock.getAll = function(callback) {
        callback(new Error('some_error'));
      };

      esnConfig.getConfigsFromAllDomains(configName)
        .then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal('some_error');
          done();
        });
    });

  });

});
