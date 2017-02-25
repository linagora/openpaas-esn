'use strict';

const _ = require('lodash');

module.exports = () => {

  return {
    getAccount
  };

  /////

  function getAccount(req, res, next) {
    if (!req.query || !req.query.account_id) {
      return res.status(400).json({ error: { code: 400, message: 'Bad Request', details: 'account_id is required' } });
    }

    const user = req.user,
          accountId = req.query.account_id;

    req.account = _.find(user.accounts, { data: { provider: 'twitter', id: accountId } });

    if (!req.account) {
      return res.status(404).json({ error: { code: 404, message: 'Not found', details: `No twitter account has been found for account ${accountId}` } });
    }

    next();
  }

};
