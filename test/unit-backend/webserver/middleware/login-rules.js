'use strict';

describe('The login-rules middleware', function() {

  before(function() {
    this.testEnv.writeDBConfigFile();
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });


  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    this.mongoose.connect(this.testEnv.mongoUrl, done);
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  it('should call next when username is not set', function(done) {
    var req = {
      body: {}
    };

    var res = {
    };

    var next = function() {
      done();
    };
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/login-rules').checkLoginCount;
    middleware(req, res, next);
  });


  it('should call next when user login limit is not reached', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var user = new User({ password: 'secret', emails: ['foo@bar.com'], login: { failures: [new Date(), new Date(), new Date()]}});
    var self = this;
    user.save(function(err, u) {
      if (err) {
        return done(err);
      }

      var conf = require('../../../../backend/core')['esn-config']('login');
      conf.store({ failure: { size: 2}}, function(err, saved) {
        if (err) {
          return done(err);
        }
        var req = {
          body: {
            username: user.emails[0]
          }
        };

        var res = {
        };

        var next = function() {
          done();
        };

        var middleware = require(self.testEnv.basePath + '/backend/webserver/middleware/login-rules').checkLoginCount;
        middleware(req, res, next);
      });
    });
  });

  it('should reject user with too many attemps', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var user = new User({ password: 'secret', emails: ['foo@bar.com'], login: { failures: [new Date(), new Date(), new Date()]}});
    var self = this;
    user.save(function(err, u) {
      if (err) {
        return done(err);
      }

      var conf = require('../../../../backend/core')['esn-config']('login');
      conf.store({ failure: { size: 1}}, function(err, saved) {
        if (err) {
          return done(err);
        }
        var req = {
          body: {
            username: user.emails[0]
          }
        };

        var res = {
          json: function() {
            done();
          }
        };

        var next = function() {
        };

        var middleware = require(self.testEnv.basePath + '/backend/webserver/middleware/login-rules').checkLoginCount;
        middleware(req, res, next);
      });
    });

  });
});
