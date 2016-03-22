'use strict';

module.exports = function() {

  function upsertAccount(user, account, callback) {
    var status = 'created';

    function accountExists(userAccount) {
      return userAccount.type === account.type && userAccount.data && userAccount.data.provider === account.data.provider && userAccount.data.id === account.data.id;
    }

    var exists = user.accounts.some(accountExists);

    if (exists) {
      status = 'updated';
      user.accounts.forEach(function(userAccount) {
        if (accountExists(userAccount)) {
          userAccount.data.username = account.data.username;
          userAccount.data.display_name = account.data.display_name;
          userAccount.data.token = account.data.token;
          userAccount.data.token_secret = account.data.token_secret;
          if (account.data.refresh_token) {
            userAccount.data.refresh_token = account.data.refresh_token;
          }
        }
      });
    } else {
      user.accounts.push(account);
    }
    user.markModified('accounts');
    user.save(function(err, updated) {
      if (err) {
        return callback(err);
      }
      callback(null, {user: updated, status: status});
    });
  }

  return {
    upsertAccount: upsertAccount
  };
};
