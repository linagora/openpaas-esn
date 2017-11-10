'use strict';

module.exports = dependencies => {
  const userModule = dependencies('esn-user');
  const esnConfig = dependencies('esn-config');
  const logger = dependencies('logger');

  return {
    getAccounts,
    deleteAccount,
    getAccountProviders
  };

  function getAccounts(req, res) {
    let accounts = req.user.accounts || [];

    if (req.query.type && req.query.type.length) {
      accounts = req.user.accounts.filter(function(account) {
        return req.query.type.toLowerCase() === account.type.toLowerCase();
      });
    }

    return res.status(200).json(accounts);
  }

  function deleteAccount(req, res) {
    const accountId = req.params.id;

    userModule.removeAccountById(req.user, accountId, function(err) {
      if (err) {
        const status = (err.message === 'Invalid account id: ' + accountId) ? 400 : 500;

        return res.status(status).json({error: status, message: 'Server Error', details: err.message});
      }

      return res.status(204).end();
    });
  }

  function getAccountProviders(req, res) {
    return esnConfig('oauth').get()
      .then(config => (Object.keys(config)
        .filter(provider => config[provider].usage && config[provider].usage.account)
      ))
      .then(providers => res.status(200).json(providers))
      .catch(err => {
        logger.error('Unable to get account providers', err);

        res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: 'Unable to get account providers'
          }
        });
      });
  }
};
