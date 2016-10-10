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

    mongoConfigMock = function(key) {
      return {
        get: function(callback) {
          return callback(null, key);
        }
      };
    };
    mongoConfigMock.setDefaultMongoose = function() {};
    FeaturesMock = {};
    confModuleMock = {
      findByDomainId: function() {
        return q();
      }
    };

    mockery.registerMock('mongoconfig', mongoConfigMock);
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
      .findByDomainId()
      .then(function() {
        expect(execSpyFn).to.have.been.calledOnce;

        return getModule()
          .findByDomainId()
          .then(function() {
            // get data from cache in second call
            expect(execSpyFn).to.have.been.calledOnce;

            done();
          });
      })
      .catch(done.bind(null, 'should resolve'));
    });

  });

});
