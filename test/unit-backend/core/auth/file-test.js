'use strict';

var chai = require('chai'),
    expect = chai.expect,
    mockery = require('mockery');

require('../../all');

describe('The file-based authentication module', function() {

  it('should deny access if the user is not defined', function(done) {
    var fileAuth = require('../../../../backend/core/auth/file').auth;
    fileAuth('foo', 'bar', function(err, result) {
      expect(err).to.be.null;
      expect(result).to.be.false;
      done();
    });
  });

  it('should deny access if there are not users in the database', function(done) {
    mockery.registerMock('../../../config/users.json', { users: [] });
    var fileAuth = require('../../../../backend/core/auth/file').auth;

    fileAuth('user', 'secret', function(err, result) {
      expect(err).to.be.null;
      expect(result).to.be.false;
      done();
    });
  });

  it('should deny access if the user is not in the database', function(done) {
    mockery.registerMock('../../../config/users.json', { users: [{
      username: 'user1@linagora.com',
      password: 'e5e9fa1ba31ecd1ae84f75caaa474f3a663f05f4'
    }] });

    var fileAuth = require('../../../../backend/core/auth/file').auth;

    fileAuth('user2', 'secret', function(err, result) {
      expect(err).to.be.null;
      expect(result).to.be.false;
      done();
    });
  });

  it('should deny access if the wrong password is supplied', function(done) {
    mockery.registerMock('../../../config/users.json', { users: [{
      username: 'user1@linagora.com',
      password: '123'
    }] });

    var fileAuth = require('../../../../backend/core/auth/file').auth;

    fileAuth('user1@linagora.com', 'invalidPassword', function(err, result) {
      expect(err).to.be.null;
      expect(result).to.be.false;
      done();
    });
  });

  it('should allow access if credentials are ok', function(done) {
    mockery.registerMock('../../../config/users.json', { users: [{
      id: 'user1@linagora.com',
      password: '$2a$05$spm9WF0kAzZwc5jmuVsuYexJ8py8HkkZIs4VsNr3LmDtYZEBJeiSe'
    }] });

    var fileAuth = require('../../../../backend/core/auth/file').auth;

    fileAuth('user1@linagora.com', 'secret', function(err, result) {
      expect(err).to.be.null;
      expect(result).to.deep.equal(
        {provider: 'file', emails: [{value: 'user1@linagora.com'}]}
      );
      done();
    });
  });

  it('should be able to verify its own crypted password', function(done) {
    var fileAuth = require('../../../../backend/core/auth/file');
    fileAuth.crypt('secret', function(err, crypted) {
      expect(err).to.be.null;

      fileAuth.comparePassword('secret', crypted, function(err, match) {
        expect(err).to.be.null;
        expect(match).to.be.true;
        done();
      });
    });
  });

});
