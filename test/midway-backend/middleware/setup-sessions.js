'use strict';

var request = require('supertest'),
    fs = require('fs-extra'),
    mongoose = require('mongoose'),
    expect = require('chai').expect;

describe('The sessions middleware', function() {

  var app;
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
    app = require(this.testEnv.basePath + '/backend/webserver/application');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var User = mongoose.model('User');
    var u = new User(user);
    u.save(function(err, saved) {
      if (err) {
        return done(err);
      }
      done();
    });
  });

  after(function(done) {
    fs.unlinkSync(this.testEnv.tmp + '/default.json');
    this.helpers.mongo.dropCollections(done);
  });

  it('should be a MongoDB Session Storage on "connected" event', function(done) {
    function checkSession(err) {
      if (err) {
        return done(err);
      }
      mongoose.connection.collection('sessions').find().toArray(function(err, results) {
        expect(results[0]._id).to.exist;
        var session = results[0].session;
        expect(session).to.exist;
        expect(JSON.parse(session).passport.user).to.equal('secret@linagora.com');
        done();
      });
    }

    request(app)
      .get('/')
      .expect(200);
    setTimeout(function() {
      request(app)
        .post('/api/login')
        .send({username: user.emails[0], password: user.password, rememberme: false})
        .expect(200)
        .end(checkSession);
    }, 50);
  });
});
