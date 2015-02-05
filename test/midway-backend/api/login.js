'use strict';

var request = require('supertest'),
    cookie = require('cookie'),
    expect = require('chai').expect;

describe('The login API', function() {
  var app;
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
      app = self.helpers.requireBackend('webserver/application');
      self.mongoose = require('mongoose');
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

  it('should not log the user with wrong credentials', function(done) {
    request(app)
      .post('/api/login')
      .send({username: 'foo', password: 'bar'})
      .expect(403)
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
        var req = request(app).get('/api/user');
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

  describe('the loginAsUser api helper', function() {
    it('should return a request creation function that is logged with the credentials', function(done) {
      user.rememberme = true;
      this.helpers.api.loginAsUser(app, user.emails[0], user.password, function(err, logAsUser0) {
        expect(err).to.be.null;
        expect(logAsUser0).to.be.a.function;
        var r = logAsUser0(request(app).get('/api/user'));
        r.expect(200)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.emails).to.be.an.array;
            expect(res.body.emails).to.have.length(1);
            expect(res.body.emails[0]).to.exist;
            expect(res.body.emails[0]).to.equal(user.emails[0]);
            done();
          });
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
        var req = request(app).get('/api/user');
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
      .get('/api/user')
      .expect(401)
      .end(done);
  });

  it('should not be able to login when user tried to log in too many times', function(done) {

    var User = this.mongoose.model('User');
    User.loadFromEmail(user.emails[0], function(err, currentUser) {
      if (err) {
        return done(err);
      }

      currentUser.login.failures = [new Date(), new Date()];
      currentUser.save(function(err, saved) {
        if (err) {
          return done(err);
        }

        var conf = require('../../../backend/core')['esn-config']('login');
        conf.store({ failure: { size: 1}}, function(err, saved) {
          if (err) {
            return done(err);
          }

          request(app)
            .post('/api/login')
            .send({username: user.emails[0], password: user.password, rememberme: false})
            .expect(403)
            .end(done);
        });
      });
    });
  });

  it('should be able to login when user did not tried to log in too many times', function(done) {
    var conf = require('../../../backend/core')['esn-config']('login');
    conf.store({ failure: { size: 1000}}, function(err, saved) {
      if (err) {
        return done(err);
      }
      request(app)
        .post('/api/login')
        .send({username: user.emails[0], password: user.password, rememberme: false})
        .expect(200)
        .end(done);
    });
  });
});

