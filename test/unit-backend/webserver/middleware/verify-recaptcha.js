'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The verify-recaptcha middleware', function() {
  var req, next, goodEsnConfig, badEsnConfig;

  beforeEach(function() {
    req = {
      connection: {
        remoteAddress: '1'
      },
      body: {
        username: 'usename',
        password: 'password',
        recaptcha: {
          data: {
            response: 'response',
            challenge: 'challenge'
          }
        }
      },
      recaptchaFlag: true
    };
    next = function(cb) {
      return cb;
    };
  });

  it('should be pass through and call next() if there is no recaptchaFlag setted to true in req', function(done) {
    delete req.recaptchaFlag;
    var verify = require(this.testEnv.basePath + '/backend/webserver/middleware/verify-recaptcha').verify;
    verify(req, {}, next(done));
  });

  it('should response a 403 json with a flag recpatcha setted to true for the client if recaptcha data is not in the req', function(done) {
    delete req.body.recaptcha;
    var res = {
      json: function(code, data) {
        expect(code).to.equal(403);
        expect(data.recaptcha).to.be.true;
        done();
      }
    };
    var verify = require(this.testEnv.basePath + '/backend/webserver/middleware/verify-recaptcha').verify;
    verify(req, res, function() {});
  });

  it('should create a Recaptcha object and verify the data challenge/response', function(done) {
    var RecaptchaMock = {
      Recaptcha: function Recaptcha(pubkey, privkey, data) {
        this.data = data;
      }
    };
    RecaptchaMock.Recaptcha.prototype.verify = function() {
      expect(this.data.response).to.equal('response');
      expect(this.data.challenge).to.equal('challenge');
      done();
    };
    mockery.registerMock('recaptcha', RecaptchaMock);

    var esnConfig = function() {
      return {
        get: function(callback) {
          return callback(null, {publickey: 'publickey', privatekey: 'privatekey'});
        }
      };
    };
    mockery.registerMock('../../core/esn-config', esnConfig);

    var verify = require(this.testEnv.basePath + '/backend/webserver/middleware/verify-recaptcha').verify;
    verify(req, {}, {});
  });

  it('should call next() if verify is a success', function(done) {
    var RecaptchaMock = {
      Recaptcha: function Recaptcha(pubkey, privkey, data) {}
    };
    RecaptchaMock.Recaptcha.prototype.verify = function(callback) {
      return callback(true, null);
    };
    mockery.registerMock('recaptcha', RecaptchaMock);

    var esnConfig = function() {
      return {
        get: function(callback) {
          return callback(null, {publickey: 'publickey', privatekey: 'privatekey'});
        }
      };
    };
    mockery.registerMock('../../core/esn-config', esnConfig);

    var verify = require(this.testEnv.basePath + '/backend/webserver/middleware/verify-recaptcha').verify;
    verify(req, {}, next(done));
  });

  it('should return a json error if verify is a fail witch recaptcha setted to true', function(done) {
    var res = {
      json: function(statusCode, error) {
        expect(error.recaptcha).to.be.true;
        expect(statusCode).to.equal(403);
        expect(error.error.message).to.equal('Login error');
        done();
      }
    };
    var RecaptchaMock = {
      Recaptcha: function Recaptcha(pubkey, privkey, data) {}
    };
    RecaptchaMock.Recaptcha.prototype.verify = function(callback) {
      return callback(false, null);
    };
    mockery.registerMock('recaptcha', RecaptchaMock);

    var esnConfig = function() {
      return {
        get: function(callback) {
          return callback(null, {publickey: 'publickey', privatekey: 'privatekey'});
        }
      };
    };
    mockery.registerMock('../../core/esn-config', esnConfig);

    var verify = require(this.testEnv.basePath + '/backend/webserver/middleware/verify-recaptcha').verify;
    verify(req, res, {});
  });

  it('should be pass through if the no recaptcha config from the esnConfig is available', function(done) {
    mockery.registerMock('recaptcha', {});

    var esnConfig = function() {
      return {
        get: function(callback) {
          return callback(null, null);
        }
      };
    };
    mockery.registerMock('../../core/esn-config', esnConfig);

    var verify = require(this.testEnv.basePath + '/backend/webserver/middleware/verify-recaptcha').verify;
    verify(req, {}, next(done));
  });
});
