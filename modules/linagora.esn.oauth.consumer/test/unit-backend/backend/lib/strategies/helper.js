'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The strategy helper', function() {

  describe('The upsertAccount function', function() {
    var user, account1, account2;
    var token = '1234';
    var token_secret = '88738';
    var refresh_token = 'new refresh token';

    function getModule() {
      return require('../../../../../backend/lib/strategies/helper')(function() {});
    }

    beforeEach(function() {
      user = {
        accounts: [],
        save: function(callback) {
          return callback(null, user);
        },
        markModified: function() {}
      };

      account1 = {
        type: 'oauth',
        data: {
          provider: 'twitter',
          id: 1,
          display_name: 'twitter display name',
          token: token,
          token_secret: token_secret
        }
      };

      account2 = {
        type: 'oauth',
        data: {
          provider: 'google',
          id: 2,
          display_name: 'google display name',
          token: token,
          refresh_token: refresh_token
        }
      };

    });

    it('should add account if not already in accounts', function(done) {
      getModule().upsertAccount(user, account1, function(err, saved) {
        expect(saved.status).to.equal('created');
        expect(saved.user.accounts[0]).to.deep.equal(account1);
        done();
      });
    });

    it('should update all accounts if already in accounts', function(done) {
      var token = '1234';
      var token_secret = '88738';
      var username = 'username';
      var display_name = 'display_name';
      user.accounts.push(account1);
      user.accounts.push(account1 );

      account1.data.username = username;
      account1.data.display_name = display_name;
      account1.data.token = token;
      account1.data.token_secret = token_secret;

      getModule().upsertAccount(user, account1, function(err, saved) {
        expect(saved.status).to.equal('updated');
        expect(saved.user.accounts[0]).to.deep.equal({
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
        expect(saved.user.accounts[1]).to.deep.equal({
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
        expect(saved.user.accounts.length).to.equal(2);
        done();
      });
    });

    it('should update refresh_token of accounts if it exists', function(done) {
      var token = '1234';
      var token_secret = '88738';
      var refresh_token = 'new refresh token';
      var username = 'username';
      var display_name = 'display_name';

      var account = {
        type: 'oauth',
        data: {
          provider: 'google',
          id: 1,
          display_name: 'google display name',
          refresh_token: 'old token'
        }
      };
      user.accounts.push(account);

      account.data.username = username;
      account.data.display_name = display_name;
      account.data.token = token;
      account.data.refresh_token = refresh_token;
      account.data.token_secret = token_secret;

      getModule().upsertAccount(user, account, function(err, saved) {
        expect(saved.status).to.equal('updated');
        expect(saved.user.accounts[0]).to.deep.equal({
          type: 'oauth',
          data: {
            provider: 'google',
            id: 1,
            display_name: display_name,
            username: username,
            token: token,
            token_secret: token_secret,
            refresh_token: refresh_token
          }
        });
        done();
      });
    });

    it('should markModified accounts if account modified', function(done) {
      var token = '1234';
      var token_secret = '88738';
      var refresh_token = 'new refresh token';
      var username = 'username';
      var display_name = 'display_name';

      var account = {
        type: 'oauth',
        data: {
          provider: 'google',
          id: 1,
          display_name: 'google display name',
          refresh_token: 'old token'
        }
      };
      user.accounts.push(account);

      account.data.username = username;
      account.data.display_name = display_name;
      account.data.token = token;
      account.data.refresh_token = refresh_token;
      account.data.token_secret = token_secret;
      user.markModified = function(name) {
        expect(name).to.equal('accounts');
        done();
      };
      getModule().upsertAccount(user, account, function() {});
    });

    it('should not update refresh_token of accounts if it does not exists', function(done) {
      var username = 'username';
      var display_name = 'display_name';

      user.accounts.push(account2);

      var updatedAccount = {
        type: 'oauth',
        data: {
          provider: 'google',
          id: 2,
          display_name: display_name,
          username: username,
          token: token,
          token_secret: token_secret,
          refresh_token: null
        }
      };

      getModule().upsertAccount(user, updatedAccount, function(err, saved) {
        expect(saved.user.accounts[0]).to.deep.equal({
          type: 'oauth',
          data: {
            provider: 'google',
            id: 2,
            display_name: display_name,
            username: username,
            token: token,
            token_secret: token_secret,
            refresh_token: refresh_token
          }
        });
        done();
      });
    });
  });
});
