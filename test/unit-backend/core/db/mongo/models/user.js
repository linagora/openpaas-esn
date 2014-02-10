'use strict';

var expect = require('chai').expect;
var mongoose = require('mongoose');

describe('The User model', function() {

  before(function() {
    mongoose.connect('mongodb://localhost:27017/rse');
    var model = require('../../../../../../backend/core/db/mongo/models/user');
  });

  it('should load the user from email', function(done) {
    var User = mongoose.model('User');
    var emails = [];
    var email = 'foo@linagora.com';
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
    var User = mongoose.model('User');
    var emails = [];
    var email = 'foo@linagora.com';
    var email2 = 'bar@linagora.com';
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

  it('should not fund any user with not registered email', function(done) {
    var User = mongoose.model('User');
    var emails = [];
    var email = 'foo@linagora.com';
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
    var User = mongoose.model('User');

    var callback = function (item, fn) {
      item.remove(fn);
    };

    var async = require('async');
    async.parallel([
      function (cb) {
        User.find().exec(function (err, users) {
          async.forEach(users, callback, cb);
        });
      }
    ], done);
  });
});