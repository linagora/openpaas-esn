'use strict';

var expect = require('chai').expect;

describe('The mongo-based authentication module', function() {
  var emails, email, email2;

  before(function() {
    this.testEnv.writeDBConfigFile();
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  beforeEach(function(done) {
    emails = [];
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
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var mongo = require(this.testEnv.basePath + '/backend/core/auth/mongo');
    var password = 'supersecret';
    emails.push(email);
    emails.push(email2);
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails, password: password});
    u.save(function(err, data) {
      if (err) {
        return done(err);
      }
      mongo.auth(email, password, function(err, user) {
        expect(err).to.be.null;
        expect(user).to.be.not.null;
        expect(user._id).to.deep.equal(data._id);
        done();
      });
    });
  });

  it('should not auth from invalid email', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var mongo = require(this.testEnv.basePath + '/backend/core/auth/mongo');

    var password = 'supersecret';
    emails.push(email);
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails, password: password});
    u.save(function(err, data) {
      if (err) {
        return done(err);
      }
      mongo.auth(email2, password, function(err, ok) {
        expect(err).to.be.null;
        expect(ok).to.be.false;
        done();
      });
    });
  });

  it('should not auth from invalid password', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var mongo = require(this.testEnv.basePath + '/backend/core/auth/mongo');
    var password = 'supersecret';
    emails.push(email);
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails, password: password});
    u.save(function(err, data) {
      if (err) {
        done(err);
      }
      mongo.auth(email, 'secret', function(err, ok) {
        expect(err).to.be.null;
        expect(ok).to.be.false;
        done();
      });
    });
  });
});
