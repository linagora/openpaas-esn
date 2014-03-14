'use strict';

var request = require('supertest'),
    mongoose = require('mongoose'),
    fs = require('fs-extra');

describe('Passport LDAP', function() {
  var app, ldap;

  before(function() {
    fs.copySync(this.testEnv.fixtures + '/default.ldapAuth.json', this.testEnv.tmp + '/default.json');
  });

  after(function() {
    fs.unlinkSync(this.testEnv.tmp + '/default.json');
  });

  beforeEach(function(done) {
    var self = this;
    var esnconfig = require('../../../backend/core/')['esn-config']('ldap');
    var ldapconf = this.testEnv.fixtures + '/ldap.json';
    var ldapPort = '1389';
    var template = require(this.testEnv.fixtures + '/user-template').simple();

    function servers(options, callback) {
      ldap = require(self.testEnv.fixtures + '/ldap');
      ldap.start(ldapPort, function() {
        console.log('LDAP started on ', ldapPort);
        app = require(self.testEnv.basePath + '/backend/webserver/application');
        callback();
      });
    }

    esnconfig.store(JSON.parse(fs.readFileSync(ldapconf)), function(err) {
      servers(null, function() {
        console.log('Servers started');
        mongoose.connection.collection('templates').insert(template, function() {
          done();
        });
      });
    });
  });

  afterEach(function(done) {
    ldap.close();
    this.helpers.mongo.dropCollections(done);
  });

  describe('Check ldap-based auth', function() {

    it('should fail when trying to log in with empty credentials', function(done) {
      request(app)
        .post('/api/login')
        .send('username=&password=')
        .send({username: '', password: '', rememberme: false})
        .expect(400)
        .end(done);
    });

    it('should fail when trying to log in with invalid password', function(done) {
      request(app)
        .post('/api/login')
        .send({username: 'ldapuser@linagora.com', password: 'badone', rememberme: false})
        .expect(500)
        .end(done);
    });

    it.skip('should be able to login with valid credentials', function(done) {
      request(app)
        .post('/api/login')
        .send({username: 'ldapuser@linagora.com', password: 'secret', rememberme: false})
        .expect(200)
        .end(done);
    });
  });
});
