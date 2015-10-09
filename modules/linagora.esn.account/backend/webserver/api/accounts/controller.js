'use strict';

module.exports = function(dependencies) {

  function getAccounts(req, res) {
    var accounts = req.user.accounts || [];
    if (req.query.type && req.query.type.length) {
      accounts = req.user.accounts.filter(function(account) {
        return req.query.type.toLowerCase() === account.type.toLowerCase();
      });
    }

    return res.status(200).json(accounts);
  }

  return {
    getAccounts: getAccounts
  };

};
