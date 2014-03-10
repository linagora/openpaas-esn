'use strict';

var expect = require('chai').expect;

describe('The remember middleware', function() {

  describe('if config is up', function() {

    before(function(done) {
      this.testEnv.writeDBConfigFile();
      this.mongoose = require('mongoose');
      this.mongoose.connect(this.testEnv.mongoUrl, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    after(function(done) {
      this.testEnv.removeDBConfigFile();
      this.mongoose.connection.db.dropDatabase();
      this.mongoose.disconnect(done);
    });

    it('should set the cookie maxAge even if not configured (session is not set in config)', function(done) {
      require(this.testEnv.basePath + '/backend/core')['esn-config']('session');
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/rememberme').rememberMe;
      var req = {
        body: {
          rememberme: true
        },
        session: {
          cookie: {
          }
        }
      };
      var res = {
      };

      var next = function() {
        expect(req.session.cookie.maxAge).to.exist;
        done();
      };
      middleware(req, res, next);
    });

    it('should set the cookie maxAge to configured value', function(done) {
      var maxAge = 10;
      var self = this;

      var conf = require(this.testEnv.basePath + '/backend/core')['esn-config']('session');
      var session = {
        remember: maxAge
      };
      conf.store(session, function(err) {
        if (err) {
          return done(err);
        }
        var middleware = require(self.testEnv.basePath + '/backend/webserver/middleware/rememberme').rememberMe;
        var req = {
          body: {
            rememberme: true
          },
          session: {
            cookie: {
            }
          }
        };

        var res = {
        };

        var next = function() {
          expect(req.session.cookie.maxAge).to.exist;
          expect(req.session.cookie.maxAge).to.equal(maxAge);
          done();
        };
        middleware(req, res, next);
      });
    });
  });

  describe('when do not want to remember', function() {
    it('should set the cookie expire to false if rememberme is false', function(done) {
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/rememberme').rememberMe;
      var req = {
        body: {
          rememberme: false
        },
        session: {
          cookie: {
          }
        }
      };

      var res = {
      };

      var next = function() {
        expect(req.session.cookie.expires).is.false;
        done();
      };
      middleware(req, res, next);
    });
  });
});
