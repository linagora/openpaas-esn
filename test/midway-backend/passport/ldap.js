'use strict';

//
// Midway LDAP test.
// Starts the application and a LDAP server to validate LDAP-based authentication.
//

var request = require('supertest');
var fs = require('fs');
var path = require('path');

var BASEPATH = '../../..';
var tmp = path.resolve(__dirname + BASEPATH + '/../tmp');
var config = path.resolve(__dirname + '/../fixtures/default.json');
var db = path.resolve(__dirname + '/../fixtures/db.json');
var ldapconf = path.resolve(__dirname + '/../fixtures/ldap.json');
var app;
var ldap;
var port = 1389;

function expressApp(cb) {
  process.env.NODE_CONFIG = tmp;
  var webserver = require(BASEPATH + '/backend/webserver');
  var port = require(BASEPATH + '/backend/core').config('default').webserver.port;
  webserver.start(port);
  console.log('Express App started on ', port);
  app = webserver.application;
  if (cb) {
    return cb(app);
  }
}

function servers(options, cb) {
  ldap = require('../fixtures/ldap');
  ldap.start(port, function() {
    console.log('LDAP started on ', port);

    expressApp(function(application) {
      app = application;
      if (cb) {
        cb();
      }
    });
  });
}

describe('Passport LDAP', function() {

  beforeEach(function(done) {
    process.env.NODE_CONFIG = tmp;
    fs.writeFileSync(tmp + '/default.test.json', fs.readFileSync(config));
    fs.writeFileSync(tmp + '/default.json', fs.readFileSync(config));
    fs.writeFileSync(tmp + '/db.json', fs.readFileSync(db));
    var esnconfig = require('../../../backend/core/esn-config')('ldap');
    esnconfig.store(JSON.parse(fs.readFileSync(ldapconf)), function(err) {
      servers(null, function() {
        console.log('Servers started');
        return done();
      });
    });
  });

  describe('/login', function() {

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
        .send('username=ldapuser&password=secret')
        .expect(302)
        .expect('Location', '/')
        .end(done);
    });

    it('should fail when trying to log in with invalid password', function(done) {
      request(app)
        .post('/login')
        .send('username=ldapuser&password=badone')
        .expect(302)
        .expect('Location', '/login')
        .end(done);
    });
  });

  afterEach(function() {
    delete process.env.NODE_CONFIG;
    ldap.close();
  });

  after(function() {
    fs.unlinkSync(tmp + '/default.test.json');
    fs.unlinkSync(tmp + '/db.json');
    fs.unlinkSync(tmp + '/default.json');
  });
});
