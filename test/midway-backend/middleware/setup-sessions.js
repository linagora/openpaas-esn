'use strict';

var request = require('supertest'),
    fs = require('fs-extra'),
    mongoose = require('mongoose'),
    mockery = require('mockery'),
    expect = require('chai').expect;

describe('The sessions middleware', function() {

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
  });

  afterEach(function(done) {
    this.helpers.mongo.dropCollections(done);
  });

  it('should be a MongoDB Session Storage on "connected" event', function(done) {
    function checkSession(err) {
      if (err) {
        return done(err);
      }
      mongoose.connection.collection('sessions').find().toArray(function(err, results) {
        expect(results[0]._id).to.exist;
        var session = results[0].session;
        expect(session).to.exist;
        expect(JSON.parse(session).passport.user).to.equal('secret@linagora.com');
        done();
      });
    }

    this.app = require(this.testEnv.basePath + '/backend/webserver/application');

    request(this.app)
      .get('/')
      .expect(200);
    var self = this;
    setTimeout(function() {
      request(self.app)
        .post('/login')
        .send('username=secret%40linagora.com&password=secret')
        .expect(302)
        .expect('Location', '/')
        .end(checkSession);
    }, 50);
  });
});
