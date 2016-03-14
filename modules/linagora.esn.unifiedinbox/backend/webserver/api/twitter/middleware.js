'use strict';

module.exports = function(dependencies) {

  function checkRequiredBody(req, res, next) {
    if (!req.body || !req.body.account_id) {
      return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'account_id is required'}});
    }
    next();
  }

  function getAccount(req, res, next) {
    var user = req.user;
    var accountId = req.body.account_id;

    var accounts = user.accounts.filter(function(account) {
      return (account.data && account.data.provider === 'twitter' && account.data.id === accountId);
    });

    if (!accounts || !accounts.length) {
      return res.status(404).json({error: {code: 404, message: 'Not found', details: 'No account found for type ' + type}});
    }

    req.account = accounts[0];
    next();
  }

  return {
    checkRequiredBody: checkRequiredBody,
    getAccount: getAccount
  };

};
