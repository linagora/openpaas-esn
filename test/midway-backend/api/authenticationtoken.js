'use strict';

var expect = require('chai').expect,
  request = require('supertest');

describe('The authenticationtoken API', function() {

  var user;
  var email = 'user@open-paas.org';
  var password = 'secret';
  var User, webserver;

  beforeEach(function(done) {
    var self = this;
    this.mongoose = require('mongoose');

    this.testEnv.initRedisConfiguration(this.mongoose, function(err) {
      if (err) {
        return done(err);
      }

      self.testEnv.initCore(function() {
        User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
        webserver = require(self.testEnv.basePath + '/backend/webserver');

        user = new User({password: password, emails: [email]});
        user.save(function (err, saved) {
          if (err) {
            return done(err);
          }
          user._id = saved._id;
          return done();
        });
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('GET /api/authenticationtoken', function() {
    it('should send back 401 if user is not logged in', function(done) {
      request(webserver.application).get('/api/authenticationtoken').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should send back a new authentication token when logged in', function(done) {
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).get('/api/authenticationtoken'));
        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body.token).to.exist;
          expect(res.body.user).to.exist;
          expect(res.body.user).to.equal('' + user._id);
          done();
        });
      });
    });
  });

  describe('GET /api/authenticationtoken/:token', function() {
    it('should send back 401 if user is not logged in', function(done) {
      request(webserver.application).get('/api/authenticationtoken/123').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should send back 404 if token does not exist', function(done) {
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).get('/api/authenticationtoken/123'));
        req.expect(404);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    it('should send back 200 with the token information', function(done) {
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).get('/api/authenticationtoken'));
        req.expect(200);
        req.end(function(err, res) {
          if (err) {
            return done(err);
          }

          if (!res.body || !res.body.token) {
            return done(new Error('Can not get new token'));
          }

          var token = res.body.token;

          var reqToken = loggedInAsUser(request(webserver.application).get('/api/authenticationtoken/' + token));
          reqToken.expect(200);
          reqToken.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.token).to.exist;
            expect(res.body.token).to.equal(token);
            expect(res.body.user).to.exist;
            expect(res.body.user).to.equal('' + user._id);
            done();
          });
        });
      });
    });
  });

  describe('GET /api/authenticationtoken/:token/user', function() {

    it('should send back 400 if token does not exist', function(done) {
      request(webserver.application).get('/api/authenticationtoken/123/user').expect(400).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should send back 200 with the user information', function(done) {
      this.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(webserver.application).get('/api/authenticationtoken'));
        req.expect(200);
        req.end(function(err, res) {
          if (err) {
            return done(err);
          }

          if (!res.body || !res.body.token) {
            return done(new Error('Can not get new token'));
          }

          var token = res.body.token;

          request(webserver.application).get('/api/authenticationtoken/' + token + '/user').expect(200).end(function(err, res) {
            expect(err).to.be.null;
            expect(res.body._id).to.equal('' + user._id);
            expect(res.body.emails).to.exist;
            expect(res.body.emails.length).to.equal(1);
            expect(res.body.emails[0]).to.equal(email);
            done();
          });
        });
      });
    });
  });
});
