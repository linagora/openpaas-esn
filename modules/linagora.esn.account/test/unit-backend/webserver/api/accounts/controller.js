'use strict';

const expect = require('chai').expect;
const q = require('q');

describe('The Accounts Controller', function() {

  let deps, esnConfigMock;

  beforeEach(function() {
    deps = {
      'esn-user': {
        removeAccountById: () => {}
      },
      'esn-config': () => ({
        get: () => q.when(esnConfigMock)
      })
    };
  });

  const dependencies = name => deps[name];

  function requireController() {
    return require('../../../../../backend/webserver/api/accounts/controller')(dependencies);
  }

  describe('The getAccounts function', function() {
    it('should return all the accounts when no query parameter', function(done) {

      const oauthAccount = {type: 'oauth'};
      const req = {
        user: {
          accounts: [
            {type: 'email'},
            oauthAccount,
            oauthAccount
          ]
        },
        query: {}
      };

      const res = {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(data) {
              expect(data.length).to.equal(3);
              done();
            }
          };
        }
      };

      requireController().getAccounts(req, res);
    });

    it('should return the defined accounts based on the query.type parameter value', function(done) {

      const oauthAccount = {type: 'oauth'};
      const req = {
        user: {
          accounts: [
            {type: 'email'},
            oauthAccount,
            oauthAccount
          ]
        },
        query: oauthAccount
      };

      const res = {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(data) {
              expect(data).to.deep.equal([oauthAccount, oauthAccount]);
              done();
            }
          };
        }
      };

      requireController().getAccounts(req, res);
    });

    it('should return the defined accounts based on the query.type parameter value (case insensitive)', function(done) {

      const oauthAccount = {type: 'oauth'};
      const req = {
        user: {
          accounts: [
            {type: 'email'},
            oauthAccount,
            oauthAccount
          ]
        },
        query: {
          type: 'OAUTH'
        }
      };

      const res = {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(data) {
              expect(data).to.deep.equal([oauthAccount, oauthAccount]);
              done();
            }
          };
        }
      };

      requireController().getAccounts(req, res);
    });

    it('should return empty accounts list when type not found', function(done) {

      const oauthAccount = {type: 'oauth'};
      const req = {
        user: {
          accounts: [
            {type: 'email'},
            oauthAccount,
            oauthAccount
          ]
        },
        query: {
          type: 'foobar'
        }
      };

      const res = {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(data) {
              expect(data.length).to.equal(0);
              done();
            }
          };
        }
      };

      requireController().getAccounts(req, res);
    });
  });

  describe('The deleteAccount function', function() {
    let req;

    beforeEach(function() {
      req = {
        user: {
          accounts: [{ data: { id: 1 } }]
        },
        params: {
          id: 2
        }
      };
      deps['esn-user'].removeAccountById = function(user, id, callback) {
        callback();
      };
    });

    it('should return 204 if account is deleted without error', function(done) {

      const res = {
        status: function(code) {
          expect(code).to.equal(204);

          return {
            end: done
          };
        }
      };

      requireController().deleteAccount(req, res);
    });

    it('should return 400 if account not found', function(done) {
      const error = {
        message: 'Invalid account id: 2'
      };

      deps['esn-user'].removeAccountById = function(user, id, callback) {
        callback(error);
      };

      const res = {
        status: function(code) {
          expect(code).to.equal(400);

          return {
            json: function(err) {
              expect(err).to.deep.equal({error: 400, message: 'Server Error', details: error.message});
              done();
            }
          };
        }
      };

      requireController().deleteAccount(req, res);
    });

    it('should return 500 if error when saving user', function(done) {
      const error = {
        message: 'Mongo Error'
      };

      deps['esn-user'].removeAccountById = function(user, id, callback) {
        callback(error);
      };

      const res = {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(err) {
              expect(err).to.deep.equal({error: 500, message: 'Server Error', details: error.message});
              done();
            }
          };
        }
      };

      requireController().deleteAccount(req, res);
    });
  });

  describe('The getAccountProviders function', function() {
    it('should return 200 with a list of account provider', function(done) {
      esnConfigMock = {
        facebook: {
          usage: { account: false }
        },
        google: {
          usage: { account: true }
        },
        github: {
          usage: { account: true }
        },
        twitter: {}
      };

      const res = {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: providers => {
              expect(providers).to.have.length(2);
              expect(providers).to.include('github');
              expect(providers).to.include('google');
              done();
            }
          };
        }
      };

      requireController().getAccountProviders({}, res);
    });
  });
});
