'use strict';

var request = require('supertest'),
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

  beforeEach(function(done) {
    var self = this;

    this.testEnv.initCore(function() {
      self.mongoose = require('mongoose'),
      self.app = self.helpers.requireBackend('webserver/application');
      var User = self.helpers.requireBackend('core/db/mongo/models/user');
      var u = new User(user);
      u.save(function(err, saved) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
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
