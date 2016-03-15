'use strict';

var twitter = require('./core.js');
var q = require('q');

module.exports = function(dependencies) {
  var esnconfig = dependencies('esn-config');
  var logger = dependencies('logger');

  function getTweets(req, res) {
    var account = req.account;

    q.ninvoke(esnconfig('oauth'), 'get')
      .then(function(oauth) {
        if (!(oauth && oauth.twitter)) {
          logger.error('Can not get oauth configuration for twitter configuration');
          return res.status(400).json({error: {code: 400, message: 'Can not get oauth configuration for twitter configuration', details: 'Can not get oauth configuration for twitter configuration'}});
        }
        var twitterConfig = {
          consumerKey: oauth.twitter.consumer_key,
          consumerSecret: oauth.twitter.consumer_secret,
          accessToken: account.data.token,
          accessTokenSecret: account.data.token_secret,
          callBackUrl: ''
        };
        return twitter.getTweets(twitterConfig);
      })
      .then(function(tweets) {
        logger.info('Successfully fetched tweets.');
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
