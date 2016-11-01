'use strict';

var twitter = require('./core');
var q = require('q');
var TIMEOUT = 60 * 1000;

module.exports = function(dependencies) {
  var esnconfig = dependencies('esn-config');
  var logger = dependencies('logger');

  function getTweets(req, res) {
    var account = req.account;
    var options = req.query;
    delete options.account_id;

    q.ninvoke(esnconfig('oauth'), 'get')
      .then(function(oauth) {

        if (!(oauth && oauth.twitter)) {
          logger.error('Can not get oauth configuration for twitter configuration');
          return res.status(503).json({error: {code: 503, message: 'Configuration issue', details: 'Cannot get oauth configuration for twitter configuration'}});
        }

        var twitterConfig = {
          consumer_key: oauth.twitter.consumer_key,
          consumer_secret: oauth.twitter.consumer_secret,
          access_token: account.data.token,
          access_token_secret: account.data.token_secret,
          timeout_ms: TIMEOUT
        };
        return twitter.getTweets(twitterConfig, options);
      })
      .then(function(tweets) {
        return res.status(200).json(tweets);
      })
      .catch(function(err) {
        logger.error('Error when trying to fetch tweets', err);
        return res.status(500).json({error: {code: 500, message: 'Error when trying to fetch tweets', details: err.message}});
      });
  }

  return {
    getTweets: getTweets
  };

};
