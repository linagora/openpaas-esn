'use strict';

var request = require('supertest'),
    mockery = require('mockery'),
    fs = require('fs-extra'),
    mongoose = require('mongoose');

describe('Passport Local', function() {
  var app;

  before(function() {
    fs.copySync(this.testEnv.fixtures + '/default.localAuth.json', this.testEnv.tmp + '/default.json');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
  });

  after(function() {
    fs.unlinkSync(this.testEnv.tmp + '/default.json');
  });

  beforeEach(function(done) {
    var user = {
      id: 'secret@linagora.com',
      emails: [{value: 'secret@linagora.com'}],
      password: '$2a$05$spm9WF0kAzZwc5jmuVsuYexJ8py8HkkZIs4VsNr3LmDtYZEBJeiSe'
    };

    mockery.registerMock('../../../config/users.json', { users: [user] });
    var template = require(this.testEnv.fixtures + '/user-template').simple();
    mongoose.connection.collection('templates').insert(template, function() {
      var mongouser = {
        emails: [user.emails[0].value],
        password: 'secret'
      };
      var User = mongoose.model('User');
      var u = new User(mongouser);
      u.save(function() {
        done();
      });
    });
    app = require(this.testEnv.basePath + '/backend/webserver/application');
  });

  afterEach(function(done) {
    this.helpers.mongo.dropCollections(done);
  });

  describe('Check file-based auth', function() {

    it('should fail when trying to log in with empty credentials', function(done) {
      request(app)
        .post('/api/login')
        .send({username: '', password: '', rememberme: false})
        .expect(400)
        .end(done);
    });

    it('should fail when trying to log in with invalid password', function(done) {
      request(app)
        .post('/api/login')
        .send({username: 'admin@linagora.com', password: 'badone', rememberme: false})
        .expect(500)
        .end(done);
    });

    it.skip('should be able to login with valid credentials', function(done) {
      request(app)
        .post('/api/login')
        .send({username: 'admin@linagora.com', password: 'secret', rememberme: false})
        .expect(200)
        .end(done);
    });
  });

});

