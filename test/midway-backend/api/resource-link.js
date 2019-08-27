'use strict';

var expect = require('chai').expect;
var request = require('supertest');

describe('The resource-links API', function() {

  var ENDPOINT = '/api/resource-links';
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
    this.mongoose.connection.db
      .dropDatabase(helpers.callbacks.noErrorAnd(() => this.mongoose.disconnect(done)));
  });

  describe('POST /api/resource-links', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'post', ENDPOINT, done);
    });

    it('should send back 400 when req.body is not a valid', function(done) {
      helpers.api.loginAsUser(webserver.application, fixtures.emails[0], fixtures.password, helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(webserver.application)
          .post(ENDPOINT))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(function(res) {
            expect(res.body).to.exist;
            expect(res.body.error.details).to.match(/Request is not a valid resource-link/);
            done();
          }));
      }));
    });

    it('should send back 400 when req.body is not a valid does not have valid source', function(done) {
      var self = this;
      helpers.api.loginAsUser(webserver.application, fixtures.emails[0], fixtures.password, helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(webserver.application)
          .post(ENDPOINT))
          .send({type: 'like', target: {objectType: 'esn.message', id: self.mongoose.Types.ObjectId()}})
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(function(res) {
            expect(res.body).to.exist;
            expect(res.body.error.details).to.match(/Request is not a valid resource-link/);
            done();
          }));
      }));
    });

    it('should send back 400 when req.body is not a valid does not have valid target', function(done) {
      helpers.api.loginAsUser(webserver.application, fixtures.emails[0], fixtures.password, helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(webserver.application)
          .post(ENDPOINT))
          .send({type: 'like', source: {objectType: 'user', id: userId}})
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(function(res) {
            expect(res.body).to.exist;
            expect(res.body.error.details).to.match(/Request is not a valid resource-link/);
            done();
          }));
      }));
    });

    it('should send back 400 when req.body is not a valid does not have type', function(done) {
      var self = this;
      helpers.api.loginAsUser(webserver.application, fixtures.emails[0], fixtures.password, helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(webserver.application)
          .post(ENDPOINT))
          .send({source: {objectType: 'user', id: userId}, target: {objectType: 'esn.message', id: self.mongoose.Types.ObjectId()}})
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(function(res) {
            expect(res.body).to.exist;
            expect(res.body.error.details).to.match(/Request is not a valid resource-link/);
            done();
          }));
      }));
    });

    it('should send back 400 when resource-link type is not supported', function(done) {
      var self = this;
      helpers.api.loginAsUser(webserver.application, fixtures.emails[0], fixtures.password, helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(webserver.application)
          .post(ENDPOINT))
          .send({type: 'unsupportedtype', source: {objectType: 'user', id: userId}, target: {objectType: 'esn.message', id: self.mongoose.Types.ObjectId()}})
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(function(res) {
            expect(res.body).to.exist;
            expect(res.body.error.details).to.match(/can not be processed/);
            done();
          }));
      }));
    });
  });
});
