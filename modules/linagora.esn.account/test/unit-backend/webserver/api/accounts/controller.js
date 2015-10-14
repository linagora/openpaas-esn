'use strict';

var expect = require('chai').expect;

describe('The Accounts Controller', function() {

  function requireController(dependencies) {
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
});
