'use strict';

var expect = require('chai').expect,
    request = require('supertest');

describe('The addressbooks controller', function() {

  var AddressBook, fixtures, webserver, userId, helpers;

  beforeEach(function(done) {
    helpers = this.helpers;

    this.mongoose = require('mongoose');
    this.testEnv.initCore(function() {
      webserver = helpers.requireBackend('webserver').webserver;
      AddressBook = helpers.requireBackend('core/db/mongo/models/addressbook');
      fixtures = helpers.requireFixture('models/users.js')(helpers.requireBackend('core/db/mongo/models/user'));

      fixtures.newDummyUser().save(helpers.callbacks.noErrorAnd(function(u) {
        userId = u._id + '';

        new AddressBook({ name: 'Professional', creator: userId }).save(helpers.callbacks.noError(done));
      }));
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('GET /api/addressbooks', function() {

    it('should send back 401 if user is not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'get', '/api/addressbooks', done);
    });

    it('should return a 200 with addressbooks list', function(done) {
      helpers.api.loginAsUser(webserver.application, fixtures.emails[0], fixtures.password, helpers.callbacks.noErrorAnd(function(loggedInAsUser) {
        loggedInAsUser(request(webserver.application)
          .get('/api/addressbooks'))
          .query({ creator: userId })
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(function(res) {
            expect(res.body[0].name).to.equal('Professional');

            done();
          }));
      }));
    });

  });

});
