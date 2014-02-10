'use strict';

//
// Midway LDAP test.
// Starts the application and a LDAP server to validate LDAP-based authentication.
//

var request = require('supertest');
var fs = require('fs');
var path = require('path');
var mongodb = require('mongodb');
var mockery = require('mockery');
var expect = require('chai').expect;

var BASEPATH = '../../..';
var tmp = path.resolve(__dirname + BASEPATH + '/../tmp');
var config = path.resolve(__dirname + '/../fixtures/default.file.json');
var db = path.resolve(__dirname + '/../fixtures/db.json');

describe('On The Fly provisioning', function() {

  before(function(done) {
    mongodb.MongoClient.connect('mongodb://localhost/midway-ldap-test', function(err, db) {
      if (err) {
        return done(err);
      }
      db.collection('templates').insert(require('../fixtures/user-template').simple(), function() {
        if (err) {
          return done(err);
        }
        db.dropCollection('users', function() {done();});
      });
    });
  });

  beforeEach(function() {
    process.env.NODE_CONFIG = tmp;
    fs.writeFileSync(tmp + '/default.test.json', fs.readFileSync(config));
    fs.writeFileSync(tmp + '/default.json', fs.readFileSync(config));
    fs.writeFileSync(tmp + '/db.json', fs.readFileSync(db));
  });

  it('should provision the user on first login', function(done) {
    mockery.registerMock('../../../config/users.json', { users: [{
      id: 'secret@linagora.com',
      password: '$2a$05$spm9WF0kAzZwc5jmuVsuYexJ8py8HkkZIs4VsNr3LmDtYZEBJeiSe'
    }] });

    function checkUser(err) {
      if (err) {
        return done(err);
      }
      mongodb.MongoClient.connect('mongodb://localhost/midway-ldap-test', function(err, db) {
        if (err) {
          return done(err);
        }
        db.collection('users').findOne({emails: 'secret@linagora.com'}, function(err, user) {
          if (err) {
            return done(err);
          }
          expect(user).to.exist;
          expect(user.emails).to.be.an.array;
          expect(user.emails).to.include('secret@linagora.com');
          done();
        });
      });
    }

    this.app = require(BASEPATH + '/backend/webserver/application');

    request(this.app)
      .post('/login')
      .send('username=secret%40linagora.com&password=secret')
      .expect(302)
      .expect('Location', '/')
      .end(checkUser);
  });

  afterEach(function(done) {
    delete process.env.NODE_CONFIG;
    fs.unlinkSync(tmp + '/default.test.json');
    fs.unlinkSync(tmp + '/default.json');
    fs.unlinkSync(tmp + '/db.json');
    mongodb.MongoClient.connect('mongodb://localhost/midway-ldap-test', function(err, db) {
      if (err) {
        return done(err);
      }
      db.collection('users').remove({},done);
    });
  });

});
