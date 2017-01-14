'use strict';

var expect = require('chai').expect;

describe('The Accounts Controller', function() {

  var deps;

  beforeEach(function() {
    deps = {
      'esn-user': {
        removeAccountById: function() {}
      }
    };
  });

  var dependencies = function(name) {
    return deps[name];
  };

  function requireController() {
    return require('../../../../../backend/webserver/api/accounts/controller')(dependencies);
  }

  describe('The getAccounts function', function() {
    it('should return all the accounts when no query parameter', function(done) {

      var oauthAccount = {type: 'oauth'};
      var req = {
        user: {
          accounts: [
            {type: 'email'},
            oauthAccount,
            oauthAccount
          ]
        },
        query: {}
      };

      var res = {
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

      var oauthAccount = {type: 'oauth'};
      var req = {
        user: {
          accounts: [
            {type: 'email'},
            oauthAccount,
            oauthAccount
          ]
        },
        query: oauthAccount
      };

      var res = {
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

      var oauthAccount = {type: 'oauth'};
      var req = {
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

      var res = {
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

      var oauthAccount = {type: 'oauth'};
      var req = {
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

      var res = {
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
    var req;

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

      var res = {
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
      var error = {
        message: 'Invalid account id: 2'
      };
      deps['esn-user'].removeAccountById = function(user, id, callback) {
        callback(error);
      };

      var res = {
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
      var error = {
        message: 'Mongo Error'
      };
      deps['esn-user'].removeAccountById = function(user, id, callback) {
        callback(error);
      };

      var res = {
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
});
