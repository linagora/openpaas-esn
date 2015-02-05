'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The cookie-lifetime middleware', function() {

  describe('if config is up', function() {

    beforeEach(function(done) {
      this.testEnv.initCore(done);
    });

    it('should set the cookie maxAge even config.get return an error', function(done) {
      var esnConfigMock = {
        'esn-config': function(session) {
          return {
            get: function(callback) {
              callback(new Error('ERROR'), { remember: 10 });
            }
          };
        }
      };
      mockery.registerMock('../../core', esnConfigMock);

      var middleware = this.helpers.requireBackend('webserver/middleware/cookie-lifetime').set;

      var req = {
        body: {
          rememberme: true
        },
        session: {
          cookie: {
          }
        }
      };
      var res = {};

      var next = function() {
        expect(req.session.cookie.maxAge).to.equal(2592000000);
        done();
      };

      middleware(req, res, next);
    });

    it('should set the cookie maxAge even if not configured (session is not set in config)', function(done) {
      var esnConfigMock = {
        'esn-config': function(session) {
          return {
            get: function(callback) {
              callback(null, null);
            }
          };
        }
      };
      mockery.registerMock('../../core', esnConfigMock);

      var middleware = this.helpers.requireBackend('webserver/middleware/cookie-lifetime').set;

      var req = {
        body: {
          rememberme: true
        },
        session: {
          cookie: {
          }
        }
      };
      var res = {};

      var next = function() {
        expect(req.session.cookie.maxAge).to.equal(2592000000);
        done();
      };

      middleware(req, res, next);
    });

    it('should set the cookie maxAge to configured value', function(done) {
      var esnConfigMock = {
        'esn-config': function(session) {
          return {
            get: function(callback) {
              callback(null, { remember: 10 });
            }
          };
        }
      };

      mockery.registerMock('../../core', esnConfigMock);

      var middleware = this.helpers.requireBackend('webserver/middleware/cookie-lifetime').set;
      var req = {
        body: {
          rememberme: true
        },
        session: {
          cookie: {
          }
        }
      };

      var res = {};

      var next = function() {
        expect(req.session.cookie.maxAge).to.equal(10);
        done();
      };
      middleware(req, res, next);
    });
  });

  it('should set the cookie expire to false if rememberme is false', function(done) {
    var middleware = this.helpers.requireBackend('webserver/middleware/cookie-lifetime').set;
    var req = {
      body: {
        rememberme: false
      },
      session: {
        cookie: {
        }
      }
    };

    var res = {};

    var next = function() {
      expect(req.session.cookie.expires).is.false;
      done();
    };
    middleware(req, res, next);
  });
});
