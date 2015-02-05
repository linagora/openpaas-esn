'use strict';

var request = require('supertest'),
    fs = require('fs-extra'),
    mongoose = require('mongoose'),
    mockery = require('mockery'),
    expect = require('chai').expect;

describe.skip('On The Fly provisioning', function() {

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
    var template = this.helpers.requireFixture('user-template').simple();
    mongoose.connection.collection('templates').insert(template, function() {
      done();
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropCollections(done);
  });

  it('should provision the user on first login', function(done) {
    function checkUser(err) {
      if (err) {
        return done(err);
      }
      mongoose.connection.collection('users').findOne({emails: 'secret@linagora.com'}, function(err, user) {
        if (err) {
          return done(err);
        }
        expect(user).to.exist;
        expect(user.emails).to.be.an.array;
        expect(user.emails).to.include('secret@linagora.com');
        done();
      });
    }

    this.app = this.helpers.requireBackend('webserver/application');

    request(this.app)
      .post('/login')
      .send('username=secret%40linagora.com&password=secret')
      .expect(302)
      .expect('Location', '/')
      .end(checkUser);
  });

});
