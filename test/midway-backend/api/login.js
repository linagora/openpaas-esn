'use strict';

var request = require('supertest'),
  fs = require('fs-extra'),
  mongoose = require('mongoose'),
  cookie = require('cookie'),
  expect = require('chai').expect;

describe('The login API', function() {
  var app;
  var user = {
    username: 'Foo Bar Baz',
    password: 'secret',
    emails: ['foo@bar.com']
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

  after(function() {
    fs.unlinkSync(this.testEnv.tmp + '/default.json');
  });

  it('should not log the user with wrong credentials', function(done) {
    request(app)
      .post('/api/login')
      .send({username: 'foo', password: 'bar'})
      .expect(404)
      .end(done);
  });

  it('should not log the user with not set credentials', function(done) {
    request(app)
      .post('/api/login')
      .send({})
      .expect(400)
      .end(done);
  });

  it('should return a session cookie with right credentials and rememberme = false', function(done) {
    user.rememberme = false;
    request(app)
      .post('/api/login')
      .send({username: user.emails[0], password: user.password, rememberme: false})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop();
        var c;
        try {
          c = cookie.parse(cookies);
        } catch (err) {
          // Ignore HTTPOnly does not have split and not supported by cookies module
        }
        expect(c['connect.sid']).to.exist;
        expect(c.Expires).to.not.exist;
        done();
      });
  });

  it('should return a persistent cookie with right credentials and rememberme = true', function(done) {
    user.rememberme = true;
    request(app)
      .post('/api/login')
      .send({username: user.emails[0], password: user.password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop();
        var c;
        try {
          c = cookie.parse(cookies);
        } catch (err) {
          // Ignore HTTPOnly does not have split and not supported by cookies module
        }
        expect(c['connect.sid']).to.exist;
        expect(c.Expires).to.exist;
        done();
      });
  });

  it('should be able to retrieve the user information with the cookie and remember=true', function(done) {
    user.rememberme = true;
    request(app)
      .post('/api/login')
      .send({username: user.emails[0], password: user.password, rememberme: true})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).get('/api/login/user');
        req.cookies = cookies;
        req.expect(200)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.emails).to.exist;
            expect(res.body.emails[0]).to.exist;
            expect(res.body.emails[0]).to.equal(user.emails[0]);
            done();
          });
      });
  });

  it('should be able to retrieve the user information with the cookie and remember=false', function(done) {
    user.rememberme = true;
    request(app)
      .post('/api/login')
      .send({username: user.emails[0], password: user.password, rememberme: false})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).get('/api/login/user');
        req.cookies = cookies;
        req.expect(200)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.emails).to.exist;
            expect(res.body.emails[0]).to.exist;
            expect(res.body.emails[0]).to.equal(user.emails[0]);
            done();
          });
      });
  });

  it('should not be able to retrieve the user information without the cookie', function(done) {
    user.rememberme = true;
    request(app)
      .get('/api/login/user')
      .expect(401)
      .end(done);
  });
});

