'use strict';

var expect = require('chai').expect,
  request = require('supertest');

describe('The authenticationtoken API', function() {

  var userId, webserver, fixtures, helpers;

  beforeEach(function(done) {
    var self = this;

    helpers = this.helpers;
    this.mongoose = require('mongoose');
    self.testEnv.initCore(function() {
      webserver = helpers.requireBackend('webserver').webserver;
      fixtures = helpers.requireFixture('models/users.js')(helpers.requireBackend('core/db/mongo/models/user'));

      fixtures.newDummyUser().save(helpers.callbacks.noErrorAnd(function(saved) {
        userId = saved.id;
        done();
      }));
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  describe('GET /api/authenticationtoken', function() {
    it('should send back 401 if user is not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'get', '/api/authenticationtoken', done);
    });

    it('should send back a new authentication token when logged in', function(done) {
      helpers.api.loginAsUser(webserver.application, fixtures.emails[0], fixtures.password, helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(webserver.application)
          .get('/api/authenticationtoken'))
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(function(res) {
            expect(res.body.token).to.exist;
            expect(res.body.user).to.equal(userId);

            done();
          }));
      }));
    });
  });

  describe('GET /api/authenticationtoken/:token', function() {
    it('should send back 401 if user is not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'get', '/api/authenticationtoken/123', done);
    });

    it('should send back 404 if token does not exist', function(done) {
      helpers.api.loginAsUser(webserver.application, fixtures.emails[0], fixtures.password, helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(webserver.application)
          .get('/api/authenticationtoken/123'))
          .expect(404)
          .end(helpers.callbacks.noError(done));
      }));
    });

    it('should send back 200 with the token information', function(done) {
      helpers.api.loginAsUser(webserver.application, fixtures.emails[0], fixtures.password, helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(webserver.application)
          .get('/api/authenticationtoken'))
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(function(res) {
            if (!res.body || !res.body.token) {
              return done(new Error('Can not get new token'));
            }

            var token = res.body.token;

            loggedInAsUser(request(webserver.application).get('/api/authenticationtoken/' + token))
              .expect(200)
              .end(helpers.callbacks.noErrorAnd(function(res) {
                expect(res.body.token).to.equal(token);
                expect(res.body.user).to.equal(userId);

                done();
              }));
          }));
      }));
    });
  });

  describe('GET /api/authenticationtoken/:token/user', function() {

    it('should send back 404 if token does not exist', function(done) {
      request(webserver.application).get('/api/authenticationtoken/123/user').expect(404).end(helpers.callbacks.noError(done));
    });

    it('should send back 200 with the user information', function(done) {
      helpers.api.loginAsUser(webserver.application, fixtures.emails[0], fixtures.password, helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(webserver.application)
          .get('/api/authenticationtoken'))
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(function(res) {
            if (!res.body || !res.body.token) {
              return done(new Error('Can not get new token'));
            }

            var token = res.body.token;

            loggedInAsUser(request(webserver.application).get('/api/authenticationtoken/' + token + '/user'))
              .expect(200)
              .end(helpers.callbacks.noErrorAnd(function(res) {
                expect(res.body._id).to.equal(userId);
                expect(res.body.accounts[0].emails).to.deep.equal(fixtures.emails);

                done();
              }));
          }));
      }));
    });

  });

});
