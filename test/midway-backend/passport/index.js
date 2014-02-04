'use strict';

var request = require('supertest');
var mockery = require('mockery');
var fs = require('fs');
var path = require('path');

var BASEPATH = '../../..';

var cookies;
var app;
var tmp = path.resolve(__dirname + BASEPATH + '/../tmp');
var fixture = path.resolve(__dirname + '/../fixtures/default.json');

function expressApp() {
  var webserver = require(BASEPATH + '/backend/webserver');
  var port = require(BASEPATH + '/backend/core').config('default').webserver.port;
  webserver.start(port);
  app = webserver.application;
  return app;
}

describe('Passport Views', function() {
  before(function() {
    process.env.NODE_CONFIG = tmp;
    fs.writeFileSync(tmp + '/db.json', JSON.stringify({hostname: 'test', dbname: 'test', port: 1337}));
    fs.writeFileSync(tmp + '/default.json', fs.readFileSync(fixture));
    mockery.enable({warnOnUnregistered: false, useCleanCache: true});

    mockery.registerMock('../../../config/users.json', { users: [{
      username: 'secret',
      password: '$2a$05$spm9WF0kAzZwc5jmuVsuYexJ8py8HkkZIs4VsNr3LmDtYZEBJeiSe'
    }] });
    app = expressApp();
  });

  describe('/login', function() {

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
        .send('username=secret&password=secret')
        .expect(302)
        .expect('Location', '/')
        .end(done);
    });

    describe('When logged in', function() {
      before(function(done) {
        request(app)
          .post('/login')
          .send('username=secret&password=secret')
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            cookies = res.headers['set-cookie'].pop().split(';')[0];
            done();
          });
      });

      it('GET /login should redirect to /', function(done) {
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
  });

  describe('/', function() {
    it('when not logged in, it should do not redirect', function(done) {
      request(app)
        .get('/')
        .expect(200)
        .end(done);
    });

    it('When logged in, it should say hello', function(done) {
      before(function(done) {
        request(app)
          .post('/login')
          .send('username=secret&password=secret')
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            cookies = res.headers['set-cookie'].pop().split(';')[0];
            done();
          });
      });

      var req = request(app).get('/');
      req.cookies = cookies;
      req.expect(200)
        .expect(/secret/)
        .end(done);
    });
  });

  describe('/account', function() {
    it('GET /account should redirect to /login', function(done) {
      request(app)
        .get('/account')
        .expect(302)
        .expect('Location', '/login')
        .expect(/Moved Temporarily/)
        .end(done);
    });

    it('GET should display account page', function(done) {
      before(function(done) {
        request(app)
          .post('/login')
          .send('username=secret&password=secret')
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            cookies = res.headers['set-cookie'].pop().split(';')[0];
            done();
          });
      });

      var req = request(app).get('/account');
      req.cookies = cookies;
      req.expect(200)
        .expect(/Account/)
        .end(done);
    });
  });

  afterEach(function() {
    mockery.deregisterAll();
    mockery.resetCache();
  });

  after(function() {
    mockery.disable();
    delete process.env.NODE_CONFIG;
    fs.unlinkSync(path.resolve(tmp + '/db.json'));
    fs.unlinkSync(path.resolve(tmp + '/default.json'));
  });
});
