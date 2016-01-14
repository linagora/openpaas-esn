'use strict';

var chai = require('chai');
var mockery = require('mockery');
var expect = chai.expect;

describe('The JWT auth webserver module', function() {

  describe('the useStrategy function', function() {

    it('should add JWT strategy in to passport with options as a function', function(done) {
      var testOpts, testVerify;
      mockery.registerMock('../../core/auth/jwt', {});
      mockery.registerMock('passport-jwt', {
        Strategy: function(opts, verifyFunction) {
          testOpts = opts;
          testVerify = verifyFunction;
        }
      });
      mockery.registerMock('passport', {
        use: function() {
          expect(testOpts).to.exist;
          expect(testVerify).to.exist;
          done();
        }
      });

      this.helpers.requireBackend('webserver/auth/jwt').useStrategy();
    });

  });

  describe('the optionsResolver function', function() {

    it('should resolve callback with error when getWebTokenConfig fails', function(done) {
      var testOpts;
      mockery.registerMock('passport', {use: function() {}});
      mockery.registerMock('../../core/auth/jwt', {
        getWebTokenConfig: function(callback) {
          return callback(new Error('expected error message'));
        }
      });
      mockery.registerMock('passport-jwt', {
        Strategy: function(opts) {
          testOpts = opts;
        }
      });

      this.helpers.requireBackend('webserver/auth/jwt').useStrategy();
      testOpts(function(err, options) {
        expect(err).to.deep.equal(new Error('expected error message'));
        expect(options).to.not.exist;
        done();
      });
    });

    it('should resolve callback using the given config', function(done) {
      var testOpts;
      mockery.registerMock('passport', {use: function() {}});
      mockery.registerMock('../../core/auth/jwt', {
        getWebTokenConfig: function(callback) {
          return callback(null, {
            publicKey: 'public key',
            algorithm: 'algo'
          });
        }
      });
      mockery.registerMock('passport-jwt', {
        Strategy: function(opts) {
          testOpts = opts;
        }
      });

      this.helpers.requireBackend('webserver/auth/jwt').useStrategy();
      testOpts(function(err, options) {
        expect(err).to.not.exist;
        expect(options).to.deep.equal({
          secretOrKey: 'public key',
          tokenQueryParameterName: 'jwt',
          algorithms: ['algo']
        });
        done();
      });
    });

  });

});
