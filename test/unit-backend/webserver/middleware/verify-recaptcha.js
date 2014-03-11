'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The verify-recaptcha middleware', function() {
  var req, next;

  beforeEach(function() {
    req = {
      connection: {
        remoteAddress: '1'
      },
      body : {
        username: 'usename',
        password: 'password',
        recaptcha: {
          response: 'response',
          challenge: 'challenge'
        }
      }
    };
  });

  it('should be pass through and call next() if there is no recaptcha data', function(done) {
    delete req.body.recaptcha;
    var next = function() {
      done();
    };
    var verify = require(this.testEnv.basePath + '/backend/webserver/middleware/verify-recaptcha').verify;
    verify(req, {}, next);
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
    var next = function() {
      done();
    };
    mockery.registerMock('recaptcha', RecaptchaMock);
    var verify = require(this.testEnv.basePath + '/backend/webserver/middleware/verify-recaptcha').verify;
    verify(req, {}, next);
  });

  it('should return a json error if verify is a fail', function(done) {
    var res = {
      json: function(statusCode, error) {
        expect(statusCode).to.equal(400);
        expect(error.error.message).to.equal('Invalid captcha');
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
    var verify = require(this.testEnv.basePath + '/backend/webserver/middleware/verify-recaptcha').verify;
    verify(req, res, {});
  });

});