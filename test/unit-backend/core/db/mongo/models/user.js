'use strict';

require('../../../../all');

var expect = require('chai').expect,
    mongoose = require('mongoose');

describe('The User model', function() {
  var User, emails, email, email2;

  before(function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
  });

  beforeEach(function() {
    mongoose.connect(this.testEnv.mongoUrl);
    User = mongoose.model('User');
    emails = [];
    email = 'foo@linagora.com';
    email2 = 'bar@linagora.com';
  });

  it('should load the user from email', function(done) {
    emails.push(email);
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});
    u.save(function(err, data) {
      if (err) {
        done(err);
      }
      User.loadFromEmail(email, function(err, user) {
        expect(err).to.not.exist;
        expect(user).to.exist;
        done();
      });
    });
  });

  it('should load user from any valid email', function(done) {
    emails.push(email);
    emails.push(email2);
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});
    u.save(function(err, data) {
      if (err) {
        done(err);
      }
      User.loadFromEmail(email, function(err, user) {
        expect(err).to.not.exist;
        expect(user).to.exist;
        done();
      });
    });
  });

  it('should not found any user with not registered email', function(done) {
    emails.push(email);
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});
    u.save(function(err, data) {
      if (err) {
        done(err);
      }
      User.loadFromEmail('bar@linagora.com', function(err, user) {
        expect(user).to.not.exist;
        done();
      });
    });
  });

  afterEach(function(done) {
    emails = [];

    var callback = function(item, fn) {
      item.remove(fn);
    };

    var async = require('async');
    async.parallel([
      function(cb) {
        User.find().exec(function(err, users) {
          async.forEach(users, callback, cb);
        });
      }
    ], function() {
      mongoose.disconnect(done);
    });
  });
});
