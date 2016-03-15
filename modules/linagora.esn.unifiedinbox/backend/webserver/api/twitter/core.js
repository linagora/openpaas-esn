'use strict';

var Twitter = require('twitter-node-client').Twitter;
var q = require('q');

function _pruneMentions(tweets) {
  return tweets.map(function(tweet) {
    return {
      id: tweet.id,
      author: {
        id: tweet.user.id,
        displayName: tweet.user.name,
        avatar: tweet.user.profile_image_url_https.replace('_normal.', '.')
      },
      date: tweet.created_at,
      text: tweet.text,
      //meta: {},
      //rcpt
      //media
    };
  });
}

function getTweets(twitterConfig, options) {
  var defer = q.defer();

  function error(err, response, body) {
    defer.reject(err);
  };

  function success(data) {
    var tweets = _pruneMentions(JSON.parse(data));
    console.log('TWEETS on success', tweets);
    defer.resolve(tweets);
  };

  var twitter = new Twitter(twitterConfig);
  twitter.getMentionsTimeline({ count: '10'}, error, success);
  console.log('Return promise');
  return defer.promise;
}

module.exports = {
  getTweets: getTweets
};
