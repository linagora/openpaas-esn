'use strict';

var request = require('supertest'),
    mockery = require('mockery'),
    fs = require('fs-extra'),
    mongoose = require('mongoose');

describe('Passport Local', function() {
  var app;

  before(function() {
    fs.copySync(this.testEnv.fixtures + '/default.localAuth.json', this.testEnv.tmp + '/default.json');
  });

  after(function() {
    fs.unlinkSync(this.testEnv.tmp + '/default.json');
  });

  beforeEach(function(done) {
    mockery.registerMock('../../../config/users.json', { users: [{
      id: 'secret@linagora.com',
      emails: [{value: 'secret@linagora.com'}],
      password: '$2a$05$spm9WF0kAzZwc5jmuVsuYexJ8py8HkkZIs4VsNr3LmDtYZEBJeiSe'
    }] });
    var template = require(this.testEnv.fixtures + '/user-template').simple();
    mongoose.connection.collection('templates').insert(template, function() {
      done();
    });

    app = require(this.testEnv.basePath + '/backend/webserver/application');
  });

  afterEach(function(done) {
    this.helpers.mongo.dropCollections(done);
  });

  describe('Check file-based auth', function() {

    it('When not logged in GET /login should respond with Content-Type text/html', function(done) {
      request(app)
        .get('/login')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(/Login/)
        .end(done);
    });

    it('should fail when trying to log in with empty credentials', function(done) {
      request(app)
        .post('/login')
        .send('username=&password=')
        .expect(302)
        .expect('Location', '/login')
        .end(done);
    });

    it('should be able to login with valid credentials', function(done) {

      request(app)
        .post('/login')
        .send('username=secret%40linagora.com&password=secret')
        .expect(302)
        .expect('Location', '/')
        .end(done);
    });

    it('When logged in GET /login should redirect to /', function(done) {
      request(app)
        .post('/login')
        .send('username=secret@linagora.com&password=secret')
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(app)
            .get('/login');
          req.cookies = cookies;
          req.expect('Content-Type', /plain/)
            .expect(302)
            .expect('Location', '/')
            .expect(/Moved Temporarily/)
            .end(done);
        });
    });

    it('when not logged in, it should do not redirect', function(done) {
      request(app)
        .get('/')
        .expect(200)
        .end(done);
    });

    it.skip('When logged in, it should say hello', function(done) {
      var cookies;
      request(app)
        .post('/login')
        .send('username=secret@linagora.com&password=secret')
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(app).get('/');
          req.cookies = cookies;
          req.expect(200)
            .expect(/secret/)
            .end(done);
        });
    });

    it('GET /account should redirect to /login', function(done) {
      request(app)
        .get('/account')
        .expect(302)
        .expect('Location', '/login')
        .expect(/Moved Temporarily/)
        .end(done);
    });

    it('GET should display account page', function(done) {
      request(app)
        .post('/login')
        .send('username=secret@linagora.com&password=secret')
        .end(function(err, res) {

          if (err) {
            return done(err);
          }
          var cookies = res.headers['set-cookie'].pop().split(';')[0];

          var req = request(app).get('/account');
          req.cookies = cookies;
          req.expect(200)
            .expect(/Account/)
            .end(done);
        });
    });
  });

});

