'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The core/features module', function() {

  var DOMAIN_ID = 'domain123';
  var confModuleMock, featuresMock;

  beforeEach(function() {
    var self = this;

    confModuleMock = {};
    featuresMock = {};

    mockery.registerMock('../configuration', confModuleMock);
    mockery.registerMock('../esn-config/deprecated', { features: featuresMock });

    this.getModule = function() {
      return self.helpers.requireBackend('core/features');
    };
  });

  describe('The findFeaturesForDomain fn', function() {

    it('should remove core module before return', function(done) {
      confModuleMock.findByDomainId = function(domainId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(null, {
          modules: [{
            name: 'core'
          }, {
            name: 'not_core'
          }]
        });
      };

      this.getModule().findFeaturesForDomain(DOMAIN_ID, function(err, features) {
        expect(err).to.not.exist;
        expect(features).to.deep.equal({
          modules: [{
            name: 'not_core'
          }]
        });
        done();
      });
    });

    it('should fallback to use features collection when there is error while getting data from configurations collection', function(done) {
      confModuleMock.findByDomainId = function(domainId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(new Error());
      };

      featuresMock.findByDomainId = function(domainId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(null, {
          modules: [{
            name: 'core'
          }, {
            name: 'not_core'
          }]
        });
      };

      this.getModule().findFeaturesForDomain(DOMAIN_ID, function(err, features) {
        expect(err).to.not.exist;
        expect(features).to.deep.equal({
          modules: [{
            name: 'not_core'
          }]
        });
        done();
      });
    });

    it('should fallback to use features collection when no configuration found from configurations collection', function(done) {
      confModuleMock.findByDomainId = function(domainId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(null, null);
      };

      featuresMock.findByDomainId = function(domainId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(null, {
          modules: [{
            name: 'core'
          }, {
            name: 'not_core'
          }]
        });
      };

      this.getModule().findFeaturesForDomain(DOMAIN_ID, function(err, features) {
        expect(err).to.not.exist;
        expect(features).to.deep.equal({
          modules: [{
            name: 'not_core'
          }]
        });
        done();
      });
    });

    it('should fail when it fails to get data from both configurations and features collection', function(done) {
      confModuleMock.findByDomainId = function(domainId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(new Error());
      };

      featuresMock.findByDomainId = function(domainId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(new Error('some_error'));
      };

      this.getModule().findFeaturesForDomain(DOMAIN_ID, function(err) {
        expect(err.message).to.equal('some_error');
        done();
      });
    });

    it('should return nothing when no data found from both configurations and features collection', function(done) {
      confModuleMock.findByDomainId = function(domainId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(null);
      };

      featuresMock.findByDomainId = function(domainId, callback) {
        expect(domainId).to.equal(DOMAIN_ID);
        callback(null);
      };

      this.getModule().findFeaturesForDomain(DOMAIN_ID, function(err, features) {
        expect(err).to.not.exist;
        expect(features).to.not.be.defined;
        done();
      });
    });

  });

});
