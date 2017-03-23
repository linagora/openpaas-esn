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

  describe('The findByDomainId fn', function() {

    it('should get data from deprecated collections once then cache it', function(done) {
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

        return getModule()
          .getConfiguration()
          .then(function() {
            // get data from cache in second call
            expect(execSpyFn).to.have.been.calledOnce;

            done();
          });
      })
      .catch(done.bind(null, 'should resolve'));
    });

    it('should not cache configuration of other domain', function(done) {
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
      .getConfiguration('domain1')
      .then(function() {
        // called twice to get both system-wide and domain-wide
        expect(execSpyFn).to.have.been.calledTwice;

        return getModule()
          .getConfiguration('domain2')
          .then(function() {
            // different domains so the data is not cached
            expect(execSpyFn).to.have.been.calledThrice;

            done();
          });
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

  });

});
