'use strict';

var chai = require('chai');
var mockery = require('mockery');
var expect = chai.expect;

describe('The JWT based authentication module', function() {
  describe('the getWebTokenSecret function', function() {
    it('should fail if esnConfig search fails', function(done) {
      var esnConfigMock = function(key) {
        expect(key).to.equal('jwtSecret');
        return {
          get: function(callback) {
            return callback(new Error());
          }
        };
      };
      mockery.registerMock('../esn-config', esnConfigMock);
      var jwt = this.helpers.requireBackend('core/auth/jwt');
      jwt.getWebTokenSecret(function(err, config) {
        expect(err).to.exist;
        expect(config).to.not.exist;
        done();
      });
    });

    it('should return esnConfig for jwtSecret key', function(done) {
      var secret = 'secret';
      var esnConfigMock = function(key) {
        expect(key).to.equal('jwtSecret');
        return {
          get: function(callback) {
            return callback(null, {secret: secret});
          }
        };
      };
      mockery.registerMock('../esn-config', esnConfigMock);
      var jwt = this.helpers.requireBackend('core/auth/jwt');
      jwt.getWebTokenSecret(function(err, config) {
        expect(err).to.not.exist;
        expect(config).to.equal(secret);
        done();
      });
    });

    it('should return and save a default value if there is no esnConfig for jwtSecret key', function(done) {
      var uuid;
      var esnConfigMock = function(key) {
        expect(key).to.equal('jwtSecret');
        return {
          get: function(callback) {
            return callback();
          },
          store: function(config, callback) {
            expect(config.secret).to.be.a('string');
            uuid = config.secret;
            return callback(null, uuid);
          }
        };
      };
      mockery.registerMock('../esn-config', esnConfigMock);
      var jwt = this.helpers.requireBackend('core/auth/jwt');
      jwt.getWebTokenSecret(function(err, config) {
        expect(err).to.not.exist;
        expect(config).to.equal(uuid);
        done();
      });
    });
  });

  describe('the generateWebToken function', function() {
    it('should fail if no payload is provided', function() {
      var jwt = this.helpers.requireBackend('core/auth/jwt');
      jwt.generateWebToken(null, function(err, token) {
        expect(err).to.exist;
        expect(token).to.not.exist;
      });
    });

    it('should fail if webtoken secret retrieval fails', function() {
      var payload = {user: 'me', email: 'me@me.me'};
      var jwt = this.helpers.requireBackend('core/auth/jwt');
      jwt.getWebTokenSecret = function(callback) {
        return callback(new Error());
      };
      jwt.generateWebToken(payload, function(err, token) {
        expect(err).to.exist;
        expect(token).to.not.exist;
      });
    });

    it('should return a webtoken', function() {
      var payload = {user: 'me', email: 'me@me.me'};
      var secret = 'secret';
      var token = 'aaabbbcccddd123456';
      var jwtLibMock = {
        sign: function(_payload, _secret, opts, callback) {
          expect(_payload).to.deep.equal(payload);
          expect(_secret).to.equal(secret);
          return callback(token);
        }
      };
      mockery.registerMock('jsonwebtoken', jwtLibMock);

      var jwt = this.helpers.requireBackend('core/auth/jwt');
      jwt.getWebTokenSecret = function(callback) {
        return callback(null, secret);
      };
      jwt.generateWebToken(payload, function(err, _token) {
        expect(err).to.not.exist;
        expect(_token).to.equal(token);
      });
    });
  });
});
