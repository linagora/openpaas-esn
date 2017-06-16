'use strict';

var mockery = require('mockery');
var sinon = require('sinon');
var q = require('q');
var expect = require('chai').expect;

describe('The core/esn-config module', function() {

  var confModuleMock, fallbackModuleMock, configurationMock;

    beforeEach(function() {

    configurationMock = {
      modules: [{
        name: 'core',
        configurations: [{
          name: 'config1',
          value: 'config1'
        }, {
          name: 'config2',
          value: { key1: { key2: 'config2' } }
        }]
      }, {
        name: 'inbox',
        configurations: [{
          name: 'inbox1',
          value: 'inbox1'
        }, {
          name: 'inbox2',
          value: false
        }]
      }]
    };

    confModuleMock = {};
    fallbackModuleMock = {};

    mockery.registerMock('../configuration', confModuleMock);
    mockery.registerMock('./fallback', fallbackModuleMock);

    this.getModule = function() {
      return this.helpers.requireBackend('core/esn-config');
    };
  });

  describe('The get fn', function() {

    beforeEach(function() {
      fallbackModuleMock.getConfiguration = function() {
        return q(configurationMock);
      };
    });

    it('should return promise that resolves configuration', function(done) {
      this.getModule()('config1').get().then(function(data) {
        expect(data).to.equal('config1');
        done();
      });
    });

    it('should return promise resolving configuration even it has falsy value', function(done) {
      this.getModule()('inbox2').inModule('inbox').get().then(function(data) {
        expect(data).to.equal(false);
        done();
      });
    });

    it('should call callback with configuration', function(done) {
      this.getModule()('config1').get(function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.equal('config1');
        done();
      });
    });

    it('should support getting configuration from custom module', function(done) {
      this.getModule()('inbox1').inModule('inbox').get(function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.equal('inbox1');
        done();
      });
    });

    it('should support getting configuration for specified domain', function(done) {
      var user = {
        preferredDomainId: 'domain123'
      };

      confModuleMock.findByDomainId = sinon.spy(function(domainId, callback) {
        expect(domainId).to.equal(user.preferredDomainId);
        callback(null, configurationMock);
      });

      this.getModule()('config1').forUser(user).get(function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.equal('config1');
        done();
      });
    });

    it('should support getting configuration key', function(done) {
      var key = 'key1.key2';

      this.getModule()('config2').get(key, function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.equal('config2');
        done();
      });
    });

    it('should support getting configuration key (in promise style)', function(done) {
      var key = 'key1.key2';

      this.getModule()('config2').get(key).then(function(data) {
        expect(data).to.equal('config2');
        done();
      });
    });
  });

  describe('The getFromAllDomains fn', function() {

    it('should get configurations from all documents in configurations collection', function(done) {
      confModuleMock.getAll = function(callback) {
        callback(null, [{
          domain_id: 'domain1',
          modules: [{
            name: 'inbox',
            configurations: [{
              name: 'inbox1',
              value: 'domain1'
            }]
          }]
        }, {
          domain_id: 'domain2',
          modules: [{
            name: 'inbox',
            configurations: [{
              name: 'inbox1',
              value: 'domain2'
            }]
          }]
        }]);
      };

      this.getModule()('inbox1').inModule('inbox').getFromAllDomains(function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.deep.equal([{
          domainId: 'domain1',
          config: 'domain1'
        }, {
          domainId: 'domain2',
          config: 'domain2'
        }]);
        done();
      });
    });

  });

  describe('The set fn', function() {

    beforeEach(function() {
      confModuleMock.findConfiguration = function(domainId, userId, callback) {
        callback(null, configurationMock);
      };
    });

    it('should modify then update configuration to database', function(done) {
      var updatedConfiguration = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'config1',
            value: 'new value'
          }, {
            name: 'config2',
            value: { key1: { key2: 'config2' } }
          }]
        }, {
          name: 'inbox',
          configurations: [{
            name: 'inbox1',
            value: 'inbox1'
          }, {
            name: 'inbox2',
            value: false
          }]
        }]
      };

      confModuleMock.update = function(configuration, callback) {
        expect(configuration).to.deep.equal(updatedConfiguration);
        callback();
      };

      this.getModule()('config1').set('new value', function(err) {
        expect(err).to.not.exist;
        done();
      });
    });

    it('should support update configuration by key', function(done) {
      var updatedConfiguration = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'config1',
            value: 'config1'
          }, {
            name: 'config2',
            value: { key1: { key2: 'new value' } }
          }]
        }, {
          name: 'inbox',
          configurations: [{
            name: 'inbox1',
            value: 'inbox1'
          }, {
            name: 'inbox2',
            value: false
          }]
        }]
      };

      confModuleMock.update = function(configuration, callback) {
        expect(configuration).to.deep.equal(updatedConfiguration);
        callback();
      };

      this.getModule()('config2').set('key1.key2', 'new value', function(err) {
        expect(err).to.not.exist;
        done();
      });
    });

  });

  describe('The store fn', function() {

    beforeEach(function() {
      confModuleMock.findConfiguration = function(domainId, userId, callback) {
        callback(null, configurationMock);
      };
    });

    it('should store configuration to database', function(done) {
      var updatedConfiguration = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'config1',
            value: { key: 'new value' }
          }, {
            name: 'config2',
            value: { key1: { key2: 'config2' } }
          }]
        }, {
          name: 'inbox',
          configurations: [{
            name: 'inbox1',
            value: 'inbox1'
          }, {
            name: 'inbox2',
            value: false
          }]
        }]
      };

      confModuleMock.update = function(configuration, callback) {
        expect(configuration).to.deep.equal(updatedConfiguration);
        callback();
      };

      this.getModule()('config1').store({ key: 'new value'}, function(err) {
        expect(err).to.not.exist;
        done();
      });
    });

  });

  describe('The getConfigsForUser fn', function() {

    it('should set configuration have scope is frontend', function() {
      var user = {
        preferredDomainId: 'domain123'
      };

      mockery.registerMock('./constants', {
        CONFIG_METADATA: {
          core: {
            config1: {
              public: true
            },
            config2: {
              public: false
            }
          }
        },
        EVENTS: {}
      });

      var configuration = {
        modules: [
          { name: 'core',
            configurations: [
              { name: 'config1', value: 'value1' },
              { name: 'config2', value: 'value2' }
            ]
          }
        ]
      };
      var configExpected = {
        modules: [
          { name: 'core',
            configurations: [
              { name: 'config1', value: 'value1' }
            ]
          }
        ]
      };

      fallbackModuleMock.getConfiguration = function() {
        return q(configuration);
      };

      this.getModule().getConfigsForUser(user).then(function() {
        expect(configuration).to.deep.equal(configExpected);
      });
    });
  });
});
