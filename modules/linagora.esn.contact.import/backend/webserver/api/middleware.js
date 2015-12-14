'use strict';

module.exports = function(dependencies, lib) {

  function getImporter(req, res, next) {

    var type = req.params.type;
    var importer = lib.importers.get(type);
    if (!importer || !importer.lib || !importer.lib.importer) {
      return res.status(404).json({error: {code: 404, message: 'Not found', details: 'Can not find importer'}});
    }

    req.importer = importer.lib.importer;
    next();
  }

  function checkRequiredBody(req, res, next) {
    if (!req.body || !req.body.account_id) {
      return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'account_id is required'}});
    }
    next();
  }

  function getAccount(req, res, next) {
    var type = req.params.type;
    var user = req.user;
    var accountId = req.body.account_id;

    var accounts = user.accounts.filter(function(account) {
      return (account.data && account.data.provider === type && account.data.id === accountId);
    });

    if (!accounts || !accounts.length) {
      return res.status(404).json({error: {code: 404, message: 'Not found', details: 'No account found for type ' + type}});
    }

    req.account = accounts[0];
    next();
  }

  return {
    getImporter: getImporter,
    checkRequiredBody: checkRequiredBody,
    getAccount: getAccount
  };

};
