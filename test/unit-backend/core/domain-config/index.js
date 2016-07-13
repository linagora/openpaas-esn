'use strict';

var mockery = require('mockery');
var _ = require('lodash');
var expect = require('chai').expect;

describe('The domain-config module', function() {

  var featuresMock;
  var domainConfig;

  beforeEach(function() {
    featuresMock = {};

    function Features(feature) {
      return feature;
    }

    var mongooseMock = {
      model: function() {
        return Features;
      }
    };

    mockery.registerMock('mongoose', mongooseMock);
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

  describe('The set fn', function() {
    var DOMAIN_ID = 'domainId';
    var featureData;
    beforeEach(function() {
      featureData = {
        domain_id: DOMAIN_ID,
        modules: [{
          name: 'configurations',
          features: [{
            name: 'config1',
            value: 'config1'
          }]
        }]
      };

      featuresMock.findFeaturesForDomain = function(domainId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(null, featureData);
      };
    });

    it('should create new feature if feature of domain is not exists', function(done) {
      var  confs = [{
        name: 'config1',
        value: 'config1'
      }];

      featuresMock.updateFeatures = function(feature, callback) {
        expect(feature).to.deep.equal(featureData);
        callback();
      };

      domainConfig.set(DOMAIN_ID, confs)
        .then(function() {
          done();
        });
    });

    it('should add configuration for domain if it is not exists', function(done) {
      var newConfig = {
        name: 'newConfig',
        value: 'newConfig'
      };

      var newFeatureData = featureData;

      var configModule = _.find(newFeatureData.modules, { name: 'configurations' });
      configModule.features.push(newConfig);

      featuresMock.updateFeatures = function(feature, callback) {
        expect(feature).to.equal(newFeatureData);
        callback(null);
      };

      domainConfig.set(DOMAIN_ID, [newConfig])
        .then(function() {
          done();
        });
    });

    it('should update configuration for domain if it not exists', function(done) {
      var updateConfig = {
        name: 'config1',
        value: 'config1_updated'
      };

      featuresMock.updateFeatures = function(feature, callback) {
        var configModule = _.find(feature.modules, { name: 'configurations' });
        var config = _.find(configModule.features, { name: updateConfig.name });
        expect(config.value).to.equal(updateConfig.value);
        callback(null);
      };

      domainConfig.set(DOMAIN_ID, [updateConfig])
        .then(function() {
          done();
        });
    });

    it('should reject if update fail', function(done) {
      featuresMock.updateFeatures = function(feature, callback) {
        callback(new Error());
      };

      domainConfig.set(DOMAIN_ID, [])
        .catch(function(err) {
          expect(err).to.exists;
          done();
        });
    });
  });
});
