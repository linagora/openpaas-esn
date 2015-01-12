'use strict';

var expect = require('chai').expect,
  mockery = require('mockery');

describe('The WebSockets Auth Token module', function() {
  it('should send back error if handshake data is undefined', function(done) {
    var auth = require(this.testEnv.basePath + '/backend/wsserver/auth/token');
    auth(null, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back error if handshake query data is undefined', function(done) {
    var auth = require(this.testEnv.basePath + '/backend/wsserver/auth/token');
    auth({}, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back error if handshake query token is undefined', function(done) {
    var auth = require(this.testEnv.basePath + '/backend/wsserver/auth/token');
    auth({request: {_query: {}}}, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back error if handshake query user is undefined', function(done) {
    var auth = require(this.testEnv.basePath + '/backend/wsserver/auth/token');
    auth({request: {_query: {token: '123'}}}, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back an error if auth module #getToken send back error', function(done) {
    var mock = {
      getToken: function(token, callback) {
        return callback(new Error());
      }

    };
    mockery.registerMock('../../core/auth/token', mock);
    var auth = require(this.testEnv.basePath + '/backend/wsserver/auth/token');
    auth({request: {_query: {token: '123', user: 'foo'}}}, function(err, bool) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back an error if auth module #getToken send back nothing', function(done) {
    var mock = {
      getToken: function(token, callback) {
        return callback();
      }

    };
    mockery.registerMock('../../core/auth/token', mock);
    var auth = require(this.testEnv.basePath + '/backend/wsserver/auth/token');
    auth({request: {_query: {token: '123', user: 'foo'}}}, function(err, bool) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back error if auth module #getToken does not send back the same user as query', function(done) {
    var mock = {
      getToken: function(token, callback) {
        return callback(null, {user: 'bar'});
      }
    };
    mockery.registerMock('../../core/auth/token', mock);
    var auth = require(this.testEnv.basePath + '/backend/wsserver/auth/token');
    auth({request: {_query: {token: '123', user: 'foo'}}}, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back undefined if auth module #getToken send back valid data', function(done) {
    var mock = {
      getToken: function(token, callback) {
        return callback(null, {user: 'foo'});
      }

    };
    mockery.registerMock('../../core/auth/token', mock);
    var auth = require(this.testEnv.basePath + '/backend/wsserver/auth/token');
    auth({request: {_query: {token: '123', user: 'foo'}}}, function(err) {
      expect(err).to.not.exist;
      done();
    });
  });
});
