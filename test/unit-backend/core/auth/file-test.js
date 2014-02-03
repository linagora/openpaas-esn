'use strict';

var chai = require('chai'),
  expect = chai.expect,
  mockery = require('mockery');

describe('The file-based authentication module', function(done) {

  before(function() {
    mockery.enable({warnOnUnregistered: false, useCleanCache: true});
  });

  it('should deny access if the user is not defined', function(done) {
    var fileAuth = require('../../../../backend/core/auth/file');
    fileAuth('foo', 'bar', function(err, result) {
      expect(err).to.be.null;
      expect(result).to.be.false;
      done();
    });
  });

  it('should deny access if there are not users in the database', function(done) {
    mockery.registerMock('../../../config/users.json', { users: [] });
    var fileAuth = require('../../../../backend/core/auth/file');

    fileAuth('user', 'secret', function(err, result) {
      expect(err).to.be.null;
      expect(result).to.be.false;
      done();
    });
  });

  it('should deny access if the user is not in the database', function(done) {
    mockery.registerMock('../../../config/users.json', { users: [{
      username: 'user1',
      password: 'e5e9fa1ba31ecd1ae84f75caaa474f3a663f05f4'
    }] });

    var fileAuth = require('../../../../backend/core/auth/file');

    fileAuth('user2', 'secret', function(err, result) {
      expect(err).to.be.null;
      expect(result).to.be.false;
      done();
    });
  });

  it('should deny access if the wrong password is supplied', function(done) {
    mockery.registerMock('../../../config/users.json', { users: [{
      username: 'user1',
      password: '123'
    }] });

    var fileAuth = require('../../../../backend/core/auth/file');

    fileAuth('user1', 'invalidPassword', function(err, result) {
      expect(err).to.be.null;
      expect(result).to.be.false;
      done();
    });
  });

  it('should allow access if credentials are ok', function(done) {
    mockery.registerMock('../../../config/users.json', { users: [{
      username: 'user1',
      password: '$2a$05$spm9WF0kAzZwc5jmuVsuYexJ8py8HkkZIs4VsNr3LmDtYZEBJeiSe'
    }] });

    var fileAuth = require('../../../../backend/core/auth/file');

    fileAuth('user1', 'secret', function(err, result) {
      expect(err).to.be.null;
      expect(result).to.deep.equal(
        {username: 'user1', password: '$2a$05$spm9WF0kAzZwc5jmuVsuYexJ8py8HkkZIs4VsNr3LmDtYZEBJeiSe'}
      );
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
