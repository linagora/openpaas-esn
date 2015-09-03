'use strict';

var expect = require('chai').expect;

describe('The mongo-based authentication module', function() {
  var email, email2, User, mongo, helpers, fixtures;

  before(function() {
    this.testEnv.writeDBConfigFile();
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  beforeEach(function(done) {
    helpers = this.helpers;
    User = helpers.requireBackend('core/db/mongo/models/user');
    mongo = helpers.requireBackend('core/auth/mongo');
    fixtures = helpers.requireFixture('models/users.js')(User);
    email = 'foo@linagora.com';
    email2 = 'bar@linagora.com';

    this.mongoose = require('mongoose');
    this.mongoose.connect(this.testEnv.mongoUrl, done);
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  it('should auth from any registered email', function(done) {
    fixtures.newDummyUser([email, email2]).save(helpers.callbacks.noErrorAnd(function(data) {
      mongo.auth(email, fixtures.password, helpers.callbacks.noErrorAnd(function(user) {
        expect(user._id).to.deep.equal(data._id);

        done();
      }));
    }));
  });

  it('should not auth from invalid email', function(done) {
    fixtures.newDummyUser([email]).save(helpers.callbacks.noErrorAnd(function() {
      mongo.auth(email2, fixtures.password, helpers.callbacks.noErrorAnd(function(user) {
        expect(user).to.equal(false);

        done();
      }));
    }));
  });

  it('should not auth from invalid password', function(done) {
    fixtures.newDummyUser([email]).save(helpers.callbacks.noErrorAnd(function() {
      mongo.auth(email, 'badpassword', helpers.callbacks.noErrorAnd(function(user) {
        expect(user).to.equal(false);

        done();
      }));
    }));
  });
});
