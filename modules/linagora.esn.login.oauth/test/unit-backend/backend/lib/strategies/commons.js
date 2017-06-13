'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var q = require('q');
var mockery = require('mockery');

describe('The commons oauth login module', function() {
  var deps, type = 'facebook';
  var logger = {
    debug: function() {},
    error: function() {},
    info: function() {}
  };

  var dependencies = function(name) {
    return deps[name];
  };

  beforeEach(function() {
    deps = {
      logger: logger,
      oauth: {
      },
      helpers: {
        config: {
          getBaseUrl: function(user, callback) {
            callback(null, 'http://localhost:8080');
          }
        }
      }
    };
  });

  function getModule() {
    return require('../../../../../backend/lib/strategies/commons')(dependencies);
  }

  describe('The handleResponse function', function() {

    describe('When req.user is not defined', function() {
      it('should fail when userModule.find fails', function(done) {
        var spy = sinon.spy();
        var msg = 'An error!';
        var profile = {id: 1};
        deps.user = {
          find: function(options, callback) {
            spy();
            expect(options).to.deep.equals({
              'accounts.type': 'oauth',
              'accounts.data.provider': type,
              'accounts.data.id': profile.id
            });
            callback(new Error(msg));
          }
        };

        getModule().handleResponse(type)({}, 2, 3, profile, function(err) {
          expect(spy).to.have.been.called;
          expect(err.message).to.equal(msg);
          done();
        });
      });

      it('should set user in request and return it when found', function(done) {
        var req = {};
        var user = {id: 1};
        deps.user = {
          find: function(options, callback) {
            callback(null, user);
          }
        };

        getModule().handleResponse(type)(req, 2, 3, {}, function(err, u) {
          expect(u).to.deep.equals(user);
          expect(req.user).to.deep.equals(user);
          done();
        });
      });

      it('should fail when user not found and no email is defined in input profile', function(done) {
        var req = {};
        deps.user = {
          find: function(options, callback) {
            callback();
          }
        };

        getModule().handleResponse(type)(req, 2, 3, {}, function(err) {
          expect(err.message).to.match(/Can not provision user account without email/);
          done();
        });
      });

      it('should fail when user search from mail fails', function(done) {
        var req = {};
        var msg = 'Error while searching email';
        var email = 'foo@bar.com';

        deps.user = {
          find: function(options, callback) {
            callback();
          },
          findByEmail: function(e, callback) {
            expect(e).to.equals(email);
            return callback(new Error(msg));
          }
        };

        getModule().handleResponse(type)(req, 2, 3, {emails: [{value: email}]}, function(err) {
          expect(err.message).to.equals(msg);
          done();
        });
      });

      it('should update user account if a user is found from profile email', function(done) {
        var req = {};
        var user = {_id: 1};
        var updatedUser = {_id: 1, accounts: [{foo: 'bar'}]};
        var email = 'foo@bar.com';
        var account = {bar: 'baz'};

        deps.user = {
          find: function(options, callback) {
            callback();
          },
          findByEmail: function(e, callback) {
            expect(e).to.equals(email);
            return callback(null, user);
          }
        };

        deps.oauth = {
          helpers: {
            profileAsAccount: function() {
              return account;
            },
            upsertUserAccount: function(userByEmail, a, callback) {
              expect(userByEmail).to.deep.equals(user);
              expect(a).to.deep.equals(account);
              return callback(null, {user: updatedUser});
            }
          }
        };

        getModule().handleResponse(type)(req, 2, 3, {emails: [{value: email}]}, function(err, u) {
          expect(u).to.deep.equals(updatedUser);
          expect(req.user).to.deep.equals(updatedUser);
          done();
        });
      });

      it('should provision user when user is not found from profile email', function(done) {
        var req = {};
        var provisionUser = {_id: 1};
        var email = 'foo@bar.com';
        var account = {bar: 'baz'};
        var profile = {emails: [{value: email}], name: {givenName: 'foo', familyName: 'bar'}};

        deps.user = {
          find: function(options, callback) {
            callback();
          },
          findByEmail: function(e, callback) {
            expect(e).to.equals(email);
            return callback();
          }
        };

        deps.oauth = {
          helpers: {
            profileAsAccount: function() {
              return account;
            }
          }
        };

        mockery.registerMock('../provision', function() {
          return {
            provision: function() {
              return q(provisionUser);
            }
          };
        });

        getModule().handleResponse(type)(req, 2, 3, profile, function(err, u) {
          expect(u).to.deep.equals(provisionUser);
          expect(req.user).to.deep.equals(provisionUser);
          done();
        });
      });
    });

    describe('When req.user is defined', function() {
      it('should send it back', function(done) {
        var user = {_id: 1};
        getModule().handleResponse(type)({user: user}, 2, 3, null, function(err, u) {
          expect(u).to.deep.equals(user);
          done();
        });
      });
    });
  });

  describe('The getCallbackEndpoint function', function() {

    it('should get url correctly', function(done) {
      var expectedUrl = `/login-oauth/${type}/auth/callback`;
      expect(getModule().getCallbackEndpoint(type)).to.equals(expectedUrl);
      done();
    });
  });
});
