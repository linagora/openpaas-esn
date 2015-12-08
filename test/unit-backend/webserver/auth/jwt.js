'use strict';

var chai = require('chai');
var mockery = require('mockery');
var expect = chai.expect;
var sinon = require('sinon');

describe('The JWT auth webserver module', function() {

  describe('the useStrategy function', function() {
    it('should do nothing if an error occurs while retrieving configuration', function() {
      var jwtCoreModule = {
        getWebTokenSecret: function(callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/auth/jwt', jwtCoreModule);

      var passportMock = {
        use: sinon.spy()
      };
      mockery.registerMock('passport', passportMock);

      var jwt = this.helpers.requireBackend('webserver/auth/jwt');
      jwt.useStrategy();
      expect(passportMock.use).to.have.not.been.called;
    });

    it('should add JWT strategy in to passport with correct configuration', function(done) {
      var secret = 'secret';
      var jwtCoreModule = {
        getWebTokenSecret: function(callback) {
          return callback(null, secret);
        }
      };
      mockery.registerMock('../../core/auth/jwt', jwtCoreModule);

      var jwtStrategy = {name: 'jwt'};
      var JWTStrategyMock = {
        Strategy: function(opts, verifyFunction) {
          expect(opts).to.deep.equal({
            secretOrKey: secret,
            tokenQueryParameterName: 'jwt'
          });
          expect(verifyFunction).to.exist;
          return jwtStrategy;
        }
      };
      mockery.registerMock('passport-jwt', JWTStrategyMock);

      var passportMock = {
        use: function(strategy) {
          expect(strategy).to.deep.equal(jwtStrategy);
          done();
        }
      };
      mockery.registerMock('passport', passportMock);

      var jwt = this.helpers.requireBackend('webserver/auth/jwt');
      jwt.useStrategy();
    });
  });

});
