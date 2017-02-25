'use strict';

const twitter = require('./core');

const TIMEOUT = 60 * 1000;

module.exports = dependencies => {
  const esnconfig = dependencies('esn-config');

  return {
    getDirectMessages,
    getMentions
  };

  /////

  function getMentions(req, res) {
    return _getTweets(req, res, twitter.getMentions);
  }

  function getDirectMessages(req, res) {
    return _getTweets(req, res, twitter.getDirectMessages);
  }

  function _getTweets(req, res, method) {
    const account = req.account;

    esnconfig('oauth').get()
      .then(oauth => {
        if (!(oauth && oauth.twitter)) {
          return res.status(503).json({ error: { code: 503, message: 'Configuration issue', details: 'Cannot get oauth configuration for twitter configuration' } });
        }

        return method(_buildTwitterConfigurationObject(oauth, account), req.query);
      })
      .then(
        tweets => res.status(200).json(tweets),
        err => res.status(500).json({ error: { code: 500, message: 'Error when trying to fetch tweets', details: err.message } })
      );
  }

  function _buildTwitterConfigurationObject(oauth, account) {
    return {
      consumer_key: oauth.twitter.consumer_key,
      consumer_secret: oauth.twitter.consumer_secret,
      access_token: account.data.token,
      access_token_secret: account.data.token_secret,
      timeout_ms: TIMEOUT
    };
  }

};
