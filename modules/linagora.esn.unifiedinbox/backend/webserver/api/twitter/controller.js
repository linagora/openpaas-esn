'use strict';

var Twitter = require('twitter-node-client').Twitter;

module.exports = function(dependencies) {

  var error = function (err, response, body) {
    console.log('ERROR [%s]', err);
  };

  var success = function (data) {
    console.log('Data [%s]', data);
  };

  function getTweets(req, res) {
    var account = req.account;
    var config = dependencies('esn-config');

    config('oauth').get(function(err, oauth) {

      if (!(oauth && oauth.twitter)) {
        return defer.reject('Can not get oauth configuration for twitter importer');
      }

      var twitterConfig = {
        consumerKey: oauth.twitter.consumer_key,
        consumerSecret: oauth.twitter.consumer_secret,
        accessToken: account.data.token,
        accessTokenSecret: account.data.token_secret,
        callBackUrl: ''
      };
      var twitter = new Twitter(twitterConfig);
      twitter.getMentionsTimeline({ count: '10'}, error, success);
      twitter.getCustomApiCall('/direct_messages.json',{ count: '10'}, error, success);

      return res.status(200).end();
    });
  }

  return {
    getTweets: getTweets
  };

};
