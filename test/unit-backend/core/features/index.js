'use strict';

var mockery = require('mockery');
var q = require('q');
var expect = require('chai').expect;

describe('The core/features module', function() {

  var DOMAIN_ID = 'domain123';
  var fallbackModuleMock;

  beforeEach(function() {
    var self = this;

    fallbackModuleMock = {};

    mockery.registerMock('../esn-config/fallback', fallbackModuleMock);

    this.getModule = function() {
      return self.helpers.requireBackend('core/features');
    };
  });

  describe('The findFeaturesForDomain fn', function() {

    it('should remove core module before return', function(done) {
      fallbackModuleMock.findByDomainId = function(domainId) {
        expect(domainId).to.equal(DOMAIN_ID);

        return q({
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

  });

});
