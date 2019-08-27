'use strict';

var expect = require('chai').expect,
  request = require('supertest');

describe('The oauth client API', function() {

  var user, User;
  var email = 'user@open-paas.org';
  var password = 'secret';
  var oauthclient, OAuthClient, app, fixtures;

  beforeEach(function(done) {
    var self = this;

    self.testEnv.initCore(function() {
      User = self.helpers.requireBackend('core/db/mongo/models/user');
      OAuthClient = self.helpers.requireBackend('core/db/mongo/models/oauthclient');
      app = self.helpers.requireBackend('webserver/application');
      fixtures = self.helpers.requireFixture('models/users.js')(User);

      (user = fixtures.newDummyUser([email], password)).save(function(err, saved) {
        if (err) {
          return done(err);
        }
        user._id = saved._id;
        oauthclient = new OAuthClient({
          name: 'oauthClient',
          creator: {
            _id: user._id
          }});
        oauthclient.save(function(err, saved) {
          if (err) {
            return done(err);
          }
          oauthclient.clientId = saved.clientId;
          oauthclient.clientSecret = saved.clientSecret;
          oauthclient._id = saved._id;
          return done();
        });
      });
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  describe('GET /api/oauth/clients', function() {
    it('should send back 401 if user is not logged in', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/oauth/clients', done);
    });

    it('should send back oauth client created when logged in', function(done) {
      this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/oauth/clients'));
        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.be.null;
          expect(res.body[0].clientId).to.be.equal(oauthclient.clientId);
          expect(res.body[0].clientSecret).to.be.equal(oauthclient.clientSecret);
          done();
        });
      });
    });
  });

  describe('POST /api/oauth/clients', function() {
    it('should send back 401 if user is not logged in', function(done) {
      this.helpers.api.requireLogin(app, 'post', '/api/oauth/clients', done);
    });

    it('should send back 201 with the oauth client created', function(done) {
      this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var json = {
          name: 'newOauthClient'
        };
        var req = loggedInAsUser(request(app).post('/api/oauth/clients'));
        req.send(json).expect(201);
        req.end(function(err, res) {
          expect(res.body).to.be.exist;
          expect(res.body).to.shallowDeepEqual({ name: 'newOauthClient', creator: user.id });
          done();
        });
      });
    });
  });

  describe('GET /api/oauth/clients/:id', function() {

    it('should send back 401 if user is not logged in', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/oauth/clients/' + oauthclient._id, done);
    });

    it('should send back 500 with wrong Id', function(done) {
      this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/oauth/clients/wrongId'));
        req.expect(500, done);
      });
    });

    it('should send back 404 if not found', function(done) {
      this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/oauth/clients/' + user._id));
        req.expect(404, done);
      });
    });

    it('should send back 200 with the oauth client information', function(done) {
      this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/oauth/clients/' + oauthclient._id));
        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.be.null;
          expect(res.body).to.be.exist;
          expect(res.body).to.shallowDeepEqual({
            name: 'oauthClient',
            creator: user._id.toString(),
            clientId: oauthclient.clientId.toString(),
            clientSecret: oauthclient.clientSecret.toString()
          });
          done();
        });
      });
    });
  });

  describe('DELETE /api/oauth/clients/:id', function() {

    it('should send back 401 if user is not logged in', function(done) {
      this.helpers.api.requireLogin(app, 'delete', '/api/oauth/clients/' + oauthclient._id, done);
    });

    it('should send back 500 with wrong Id', function(done) {
      this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).delete('/api/oauth/clients/wrongId'));
        req.expect(500, done);
      });
    });

    it('should send back 404 if not found', function(done) {
      this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).delete('/api/oauth/clients/' + user._id));
        req.expect(404, done);
      });
    });

    it('should send back 200 and the oauth client should b.deleted', function(done) {
      this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).delete('/api/oauth/clients/' + oauthclient._id));
        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.be.null;
          expect(res.body).to.be.exist;
          expect(res.body).to.shallowDeepEqual({
            name: 'oauthClient',
            creator: user._id.toString(),
            clientId: oauthclient.clientId.toString(),
            clientSecret: oauthclient.clientSecret.toString()
          });
          OAuthClient.findById(oauthclient._id, function(error, oauthclient) {
            expect(oauthclient).to.be.null;
            done();
          });
        });
      });
    });
  });

  describe('GET /api/user/oauth/clients', function() {

    it('should send back 401 if user is not logged in', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/user/oauth/clients', done);
    });

    it('should send back 200 with the oauth client of user', function(done) {
      this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/user/oauth/clients'));
        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.be.null;
          expect(res.body).to.be.exist;
          expect(res.body[0]).to.shallowDeepEqual({
            name: 'oauthClient',
            creator: user._id.toString(),
            clientId: oauthclient.clientId.toString(),
            clientSecret: oauthclient.clientSecret.toString()
          });
          done();
        });
      });
    });
  });

});
