'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');

describe('the websocket JWT Auth module', function() {
  beforeEach(function() {
    mockery.registerMock('../../core/user', {});
  });

  it('should send an error if the socket is null', function(done) {

    const auth = this.helpers.requireBackend('/wsserver/auth/jwt');

    auth(null, err => {
      expect(err).to.match(/invalid socket object/);
      done();
    });
  });

  it('should send an error if the socket doesn\'t have a token in the _query', function(done) {
    const auth = this.helpers.requireBackend('/wsserver/auth/jwt');

    auth({ request: { _query: { something: 'a' } } }, err => {
      expect(err).to.match(/missing JWT/);
      done();
    });
  });

  it('should send back an error if there is no JWT configuration foud', function(done) {
    const mock = {
      getWebTokenConfig: cb => cb(new Error(), {})
    };

    mockery.registerMock('../../core/auth/jwt', mock);

    const auth = this.helpers.requireBackend('/wsserver/auth/jwt');

    auth({ request: { _query: { token: 'token' } } }, err => {
      expect(err).to.match(/No jwt config found/);
      done();
    });
  });

  it('should send back an error if the JWT is invalid', function(done) {
    const jwtAuthmock = {
      getWebTokenConfig: cb => cb(null, {
        secret: 'secret',
        issuer: 'issuer',
        audience: 'audience'
      })
    };

    const jsonwebtokenMock = {
      verify: (token, secret, options, cb) => cb(new Error('invalid token'))
    };

    mockery.registerMock('../../core/auth/jwt', jwtAuthmock);
    mockery.registerMock('jsonwebtoken', jsonwebtokenMock);

    const auth = this.helpers.requireBackend('/wsserver/auth/jwt');

    auth({ request: { _query: { token: 'token' } }}, err => {
      expect(err).to.match(/Invalid jwt/);
      done();
    });
  });

  it('should send an error if the decoded JWT doesn\'t have a sub', function(done) {
    const jwtAuthmock = {
      getWebTokenConfig: cb => cb(null, {
        secret: 'secret',
        issuer: 'issuer',
        audience: 'audience'
      })
    };

    const jsonwebtokenMock = {
      verify: (token, secret, options, cb) => cb(null, {
        id: 'something'
      })
    };

    mockery.registerMock('../../core/auth/jwt', jwtAuthmock);
    mockery.registerMock('jsonwebtoken', jsonwebtokenMock);

    const auth = this.helpers.requireBackend('/wsserver/auth/jwt');

    auth({ request: { _query: { token: 'token' } } }, err => {
      expect(err).to.match(/sub is required in the JWT payload/);
      done();
    });
  });

  it('should send an error if the user associated with sub is not found', function(done) {
    const jwtAuthmock = {
      getWebTokenConfig: cb => cb(null, {
        secret: 'secret',
        issuer: 'issuer',
        audience: 'audience'
      })
    };

    const jsonwebtokenMock = {
      verify: (token, secret, options, cb) => cb(null, {
        sub: 'something'
      })
    };

    const userModuleMock = {
      findByEmail: (email, cb) => cb(new Error('user not found'))
    };

    mockery.registerMock('../../core/auth/jwt', jwtAuthmock);
    mockery.registerMock('jsonwebtoken', jsonwebtokenMock);
    mockery.registerMock('../../core/user', userModuleMock);

    const auth = this.helpers.requireBackend('/wsserver/auth/jwt');

    auth({ request: { _query: { token: 'token' } } }, err => {
      expect(err).to.match(/User not found/);
      done();
    });
  });
});
