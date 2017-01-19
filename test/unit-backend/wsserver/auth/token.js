'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');

describe('The WebSocket Auth Token module', function() {
  it('should send back error if socket is null', function(done) {
    mockery.registerMock('../../core/auth/token', {});

    const auth = this.helpers.requireBackend('wsserver/auth/token');

    auth(null, function(err) {
      expect(err.message).to.match(/Invalid socket object passed in argument/);
      done();
    });
  });

  it('should send back error if socket query data is undefined', function(done) {
    mockery.registerMock('../../core/auth/token', {});

    const auth = this.helpers.requireBackend('wsserver/auth/token');

    auth({}, function(err) {
      expect(err.message).to.match(/Invalid socket object passed in argument/);
      done();
    });
  });

  it('should send back error if socket query token is undefined', function(done) {
    mockery.registerMock('../../core/auth/token', {});

    const auth = this.helpers.requireBackend('wsserver/auth/token');

    auth({request: {_query: {}}}, function(err) {
      expect(err.message).to.match(/Token or user not found/);
      done();
    });
  });

  it('should send back error if socket query user is undefined', function(done) {
    mockery.registerMock('../../core/auth/token', {});

    const auth = this.helpers.requireBackend('wsserver/auth/token');

    auth({request: {_query: {token: '123'}}}, function(err) {
      expect(err.message).to.match(/Token or user not found/);
      done();
    });
  });

  it('should send back an error if auth module #getToken send back error', function(done) {
    const mock = {
      getToken: function(token, callback) {
        return callback(new Error());
      }
    };

    mockery.registerMock('../../core/auth/token', mock);

    const auth = this.helpers.requireBackend('wsserver/auth/token');

    auth({request: {_query: {token: '123', user: 'foo'}}}, function(err, bool) {
      expect(err.message).to.match(/No data from token system/);
      done();
    });
  });

  it('should send back an error if auth module #getToken send back nothing', function(done) {
    const mock = {
      getToken: function(token, callback) {
        return callback();
      }
    };

    mockery.registerMock('../../core/auth/token', mock);

    const auth = this.helpers.requireBackend('wsserver/auth/token');

    auth({request: {_query: {token: '123', user: 'foo'}}}, function(err, bool) {
      expect(err.message).to.match(/No data from token system/);
      done();
    });
  });

  it('should send back error if auth module #getToken does not send back the same user as query', function(done) {
    const mock = {
      getToken: function(token, callback) {
        return callback(null, {user: 'bar'});
      }
    };

    mockery.registerMock('../../core/auth/token', mock);

    const auth = this.helpers.requireBackend('wsserver/auth/token');

    auth({request: {_query: {token: '123', user: 'foo'}}}, function(err) {
      expect(err.message).to.match(/Bad user/);
      done();
    });
  });

  it('should send back undefined if auth module #getToken send back valid data', function(done) {
    const mock = {
      getToken: function(token, callback) {
        return callback(null, {user: 'foo'});
      }
    };

    mockery.registerMock('../../core/auth/token', mock);

    const auth = this.helpers.requireBackend('wsserver/auth/token');

    auth({request: {_query: {token: '123', user: 'foo'}}}, function(err) {
      expect(err).to.not.exist;
      done();
    });
  });
});
