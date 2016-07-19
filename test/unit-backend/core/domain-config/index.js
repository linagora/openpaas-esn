'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The domain-config module', function() {

  var featuresMock;
  var domainConfig;

  beforeEach(function() {
    featuresMock = {};

    mockery.registerMock('../features', featuresMock);
    domainConfig = this.helpers.requireBackend('core/domain-config');
  });

  describe('The get fn', function() {

    var featureData;
    var DOMAIN_ID = 'domain123';

    beforeEach(function() {
      featureData = {
        domain_id: DOMAIN_ID,
        modules: [{
          name: 'configurations',
          features: [{
            name: 'config1',
            value: 'config1'
          }, {
            name: 'config2',
            value: 'config2'
          }]
        }]
      };

      featuresMock.findFeaturesForDomain = function(domainId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(null, featureData);
      };
    });

    it('should resolve an array of configurations if configNames is an array', function(done) {
      domainConfig.get(DOMAIN_ID, ['config1']).then(function(configs) {
        expect(configs).to.deep.equal([{
          name: 'config1',
          value: 'config1'
        }]);
        done();
      });
    });

    it('should still resolve if configNames is an array and one of configurations is not found', function(done) {
      domainConfig.get(DOMAIN_ID, ['config1', 'config3'])
        .then(function(configs) {
          expect(configs).to.deep.equal([{
            name: 'config1',
            value: 'config1'
          }, undefined]);
          done();
        }, done.bind(null, 'should resolve'));
    });

    it('should resolve a configuration value if configNames is a string', function(done) {
      domainConfig.get(DOMAIN_ID, 'config2').then(function(config) {
        expect(config).to.equal('config2');
        done();
      });
    });

    it('should reject if configNames is a string and the configuration is not found', function(done) {
      domainConfig.get(DOMAIN_ID, 'config3')
        .then(done.bind(null, 'should reject'), function(err) {
          expect(err.message).to.equal('No configuration found for type: config3');
          done();
        });
    });

  });

});
