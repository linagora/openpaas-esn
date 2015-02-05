'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The home controller', function() {

  beforeEach(function() {
    var loggerMock = {
      error: function() {}
    };
    mockery.registerMock('../../core/logger', loggerMock);
  });

  it('should send the recaptcha public key when rendering welcome/index without logged user', function(done) {
    var coreMock = function() {
      return {
        get: function(callback) {
          return callback(null, {publickey: 'publickey'});
        }
      };
    };
    mockery.registerMock('../../core/esn-config', coreMock);
    var index = this.helpers.requireBackend('webserver/controllers/home.js').index;

    var res = {
      render: function(url, data) {
        expect(url).to.equal('welcome/index.jade');
        expect(data.recaptchaPublicKey).to.equal('publickey');
        done();
      }
    };

    index({}, res);
  });

  it('should send a null recaptcha if it is not available in esnConfig', function(done) {
    var coreMock = function() {
      return {
        get: function(callback) {
          return callback(null, null);
        }
      };
    };
    mockery.registerMock('../../core/esn-config', coreMock);
    var index = this.helpers.requireBackend('webserver/controllers/home.js').index;

    var res = {
      render: function(url, data) {
        expect(url).to.equal('welcome/index.jade');
        expect(data.recaptchaPublicKey).to.be.null;
        done();
      }
    };

    index({}, res);
  });

  it('should return 500 if we cannot get recaptcha config from esn', function(done) {
    var coreMock = function() {
      return {
        get: function(callback) {
          return callback(new Error(''), null);
        }
      };
    };
    mockery.registerMock('../../core/esn-config', coreMock);
    var index = this.helpers.requireBackend('webserver/controllers/home.js').index;

    var res = {
      json: function(code, data) {
        expect(code).to.equal(500);
        expect(data.message).to.equal('Server Error');
        done();
      },
      render: function() {}
    };

    index({}, res);
  });
});
