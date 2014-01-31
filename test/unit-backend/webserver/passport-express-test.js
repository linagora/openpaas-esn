'use strict';

var chai = require('chai'),
  expect = chai.expect,
  mockery = require('mockery');

var request = require('supertest');


function expressApp() {
  var express = require('express');
  var passport = require('passport');
  require('../../../backend/webserver/passport');
  var flash = require('connect-flash');

  var app = express();
  app.set('showStackError', true);
  app.use(express.logger());
  app.use(express.cookieParser('keyboard cat'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  }

  app.get('/', function(req, res) {
    res.send(200);
  });

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/login', function(req, res) {
    res.send(200, 'please login');
  });

  app.post('/login',
    passport.authenticate('basic'),
    function(req, res) {
      res.send(200, 'hey');
    });

  app.get('/account', ensureAuthenticated, function(req, res) {
    res.send(200, { user: req.user });
  });
  return app;
}

describe('The passport+express auth', function(done) {

  before(function() {
    mockery.enable({warnOnUnregistered: false, useCleanCache: true});
  });

  it('should allow to get / if not authenticated', function(done) {
    var app = expressApp();
    request(app).get('/').expect(200).end(done);
  });

  it('should not allow to get /account if not authenticated', function(done) {
    var app = expressApp();
    request(app).get('/account').expect(302, done);
  });


  it('should deny access if there are not users in the database', function(done) {
    mockery.registerMock('../../../config/users.json', { users: [] });
    var app = expressApp();

    request(app)
      .post('/login').auth('user1', 'secret')
      .expect(401).end(function(err, res) {
        console.log(err);
        expect(err).to.be.null;
        done();
      });
  });

  it('should allow access with valid username/password', function(done) {
    mockery.registerMock('../../../config/users.json', { users: [{
      username: 'user1',
      password: '$2a$05$spm9WF0kAzZwc5jmuVsuYexJ8py8HkkZIs4VsNr3LmDtYZEBJeiSe'
    }] });

    var app = expressApp();

    request(app)
      .post('/login').auth('user1', 'secret')
      .expect(200).end(function(err, res) {
        console.log(err);
        expect(err).to.be.null;
        done();
      });
  });

  it('should deny access to user with wrong password', function(done) {
    mockery.registerMock('../../../config/users.json', { users: [{
      username: 'user1',
      password: '123'
    }] });

    var app = expressApp();

    request(app)
      .post('/login').auth('user1', 'secret')
      .expect(401).end(function(err, res) {
        console.log(err);
        expect(err).to.be.null;
        done();
      });
  });

  it('should deny access to unknown user', function(done) {
    mockery.registerMock('../../../config/users.json', { users: [{
      username: 'user1',
      password: '$2a$05$spm9WF0kAzZwc5jmuVsuYexJ8py8HkkZIs4VsNr3LmDtYZEBJeiSe'
    }] });

    var app = expressApp();

    request(app)
      .post('/login').auth('user2', 'secret')
      .expect(401).end(function(err, res) {
        console.log(err);
        expect(err).to.be.null;
        done();
      });
  });

  afterEach(function() {
    mockery.deregisterAll();
    mockery.resetCache();
  });

  after(function() {
    mockery.disable();
  });

});
