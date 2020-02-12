'use strict';

var mockery = require('mockery');
var sinon = require('sinon');
var q = require('q');
var expect = require('chai').expect;

describe('The core/esn-config/fallback module', function() {

  var getModule;
  var mongoConfigMock, FeaturesMock, confModuleMock;

  beforeEach(function() {
    getModule = this.helpers.requireBackend.bind(this.helpers, 'core/esn-config/fallback');

    mongoConfigMock = {
      findByDomainId: function() {
        return q();
      }
    };
    mongoConfigMock.setDefaultMongoose = function() {};
    FeaturesMock = {};
    confModuleMock = {
      findConfigurationForDomain: function() {
        return q();
      },
      findConfigurationForUser: function() {
        return q();
      }
    };

    mockery.registerMock('./mongoconfig', mongoConfigMock);
    mockery.registerMock('../../db/mongo/models/features', FeaturesMock);
    mockery.registerMock('./configuration', confModuleMock);

  });

  describe('The getConfiguration fn', function() {

    it('should get data from deprecated collections', function(done) {
      var execSpyFn = sinon.stub().returns(q({}));

      FeaturesMock.findOne = function() {
        return {
          lean: function() {
            return {
              exec: execSpyFn
            };
          }
        };
      };

      getModule()
      .getConfiguration()
      .then(function() {
        expect(execSpyFn).to.have.been.calledOnce;
        done();
      })
      .catch(done.bind(null, 'should resolve'));
    });

    it('should clone deeply the configuration to avoid mutating cache', function(done) {
      var cachedConfigurations = {
        modules: [{
          name: 'configurations',
          configurations: [{
            name: 'mail',
            value: 'mail_config'
          }]
        }]
      };

      mongoConfigMock.findByDomainId = function() {
        return q(cachedConfigurations);
      };

      FeaturesMock.findOne = function() {
        return {
          lean: function() {
            return {
              exec: function() { return q.reject(); }
            };
          }
        };
      };

      getModule()
        .getConfiguration()
        .then(function(configuration) {
          configuration.modules[0].configurations.push({});
          // still have length 1
          expect(cachedConfigurations.modules[0].configurations).to.have.length(1);

          done();
        })
        .catch(done.bind(null, 'should resolve'));
    });

    it('should merge with registered default configuration', function(done) {
      const metadatas = {
        module1: {
          configurations: {
            config1: {
              default: {
                key1: 'key1Default',
                key2: {
                  subKey1: 'subKey1Default',
                  subKey2: 'subKey2Default'
                }
              }
            }
          }
        },
        module2: {
          configurations: {
            config21: {
              default: {
                key1: 'key1Default'
              }
            }
          }
        }
      };
      const registryMock = {
        getAll: () => metadatas
      };

      const cachedConfigurations = {
        modules: [{
          name: 'module1',
          configurations: [{
            name: 'config1',
            value: {
              key1: 'setKey1',
              key2: {
                subKey1: 'setSubkey1'
              }
            }
          }]
        }]
      };

      mockery.registerMock('../registry', registryMock);
      mongoConfigMock.findByDomainId = () => q(cachedConfigurations);
      FeaturesMock.findOne = () => ({ lean: () => ({ exec: () => q.reject() }) });

      getModule()
        .getConfiguration()
        .then(configuration => {
          expect(configuration).to.deep.equal({
            modules: [{
              name: 'module1',
              configurations: [{
                name: 'config1',
                value: {
                  key1: 'setKey1',
                  key2: {
                    subKey1: 'setSubkey1',
                    subKey2: 'subKey2Default'
                  }
                }
              }]
            }, {
              name: 'module2',
              configurations: [{
                name: 'config21',
                value: {
                  key1: 'key1Default'
                }
              }]
            }]
          });

          done();
        })
        .catch(done.bind(null, 'should resolve'));
    });
  });

});
