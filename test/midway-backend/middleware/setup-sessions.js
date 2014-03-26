'use strict';

var request = require('supertest'),
    fs = require('fs-extra'),
    expect = require('chai').expect;

describe('The sessions middleware', function() {

  var user = {
    username: 'Foo Bar Baz',
    password: 'secret',
    emails: ['foo@bar.com'],
    login: {
      failures: [new Date(), new Date(), new Date()]
    }
  };

  before(function(done) {
    fs.copySync(this.testEnv.fixtures + '/default.mongoAuth.json', this.testEnv.tmp + '/default.json');
    var self = this;

    this.testEnv.initCore(function() {
      self.mongoose = require('mongoose'),
      self.app = require(self.testEnv.basePath + '/backend/webserver/application');
      var User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
      var u = new User(user);
      u.save(function(err, saved) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });

  after(function(done) {
    fs.unlinkSync(this.testEnv.tmp + '/default.json');
    this.helpers.mongo.dropCollections(done);
  });

  it('should be a MongoDB Session Storage on "connected" event', function(done) {
    var self = this;
    function checkSession(err) {
      if (err) {
        return done(err);
      }
      self.mongoose.connection.collection('sessions').find().toArray(function(err, results) {
        expect(results[0]._id).to.exist;
        var session = results[0].session;
        expect(session).to.exist;
        expect(JSON.parse(session).passport.user).to.equal(user.emails[0]);
        done();
      });
    }

    request(this.app)
      .get('/')
      .expect(200);
    setTimeout(function() {
      request(self.app)
        .post('/api/login')
        .send({username: user.emails[0], password: user.password, rememberme: false})
        .expect(200)
        .end(checkSession);
    }, 50);
  });
});
