'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The Twitter strategy', function() {

  describe('The upsertAccount function', function() {
    var user;

    function getModule() {
      return require('../../../../../backend/lib/strategies/twitter')(function() {});
    }

    beforeEach(function() {
      user = {
        accounts: [],
        save: function(callback) {
          return callback(null, user);
        }
      };
    });

    it('should add account if not already in accounts', function(done) {

      var account = {
        type: 'oauth',
        data: {
          provider: 'twitter',
          id: 1
        }
      };

      getModule().upsertAccount(user, account, function(err, saved) {
        expect(saved.accounts[0]).to.deep.equal(account);
        done();
      });
    });

    it('should update all accounts if already in accounts', function(done) {
      var token = '1234';
      var token_secret = '88738';
      var username = 'username';
      var display_name = 'display_name';

      var account = {
        type: 'oauth',
        data: {
          provider: 'twitter',
          id: 1,
          display_name: 'old display name'
        }
      };
      var account2 = {
        type: 'oauth',
        data: {
          provider: 'twitter',
          id: 1,
          display_name: 'old2 display name'
        }
      };
      user.accounts.push(account);
      user.accounts.push(account2);

      account.data.username = username;
      account.data.display_name = display_name;
      account.data.token = token;
      account.data.token_secret = token_secret;

      getModule().upsertAccount(user, account, function(err, saved) {
        expect(saved.accounts[0]).to.deep.equal({
          type: 'oauth',
          data: {
            provider: 'twitter',
            id: 1,
            display_name: display_name,
            username: username,
            token: token,
            token_secret: token_secret
          }
        });
        expect(saved.accounts[1]).to.deep.equal({
          type: 'oauth',
          data: {
            provider: 'twitter',
            id: 1,
            display_name: display_name,
            username: username,
            token: token,
            token_secret: token_secret
          }
        });
        expect(saved.accounts.length).to.equal(2);
        done();
      });
    });
  });
});
