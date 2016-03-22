'use strict';

module.exports = function(dependencies) {
  var userModule = dependencies('esn-user');

  function getAccounts(req, res) {
    var accounts = req.user.accounts || [];
    if (req.query.type && req.query.type.length) {
      accounts = req.user.accounts.filter(function(account) {
        return req.query.type.toLowerCase() === account.type.toLowerCase();
      });
    }

    return res.status(200).json(accounts);
  }

  function deleteAccount(req, res) {
    var accountId = req.params.id;
    userModule.removeAccountById(req.user, accountId, function(err) {
      if (err) {
        var status = (err.message === 'Invalid account id: ' + accountId) ? 400 : 500;
        return res.status(status).json({error: status, message: 'Server Error', details: err.message});
      }
      return res.status(204).end();
    });
  }

  return {
    getAccounts: getAccounts,
    deleteAccount: deleteAccount
  };
};
