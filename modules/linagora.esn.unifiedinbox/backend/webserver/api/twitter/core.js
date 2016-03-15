'use strict';

var Twitter = require('twitter-node-client').Twitter;
var q = require('q');

function _getUserObjectFrom(object) {
  return (object && {
    id: object.id,
    displayName: object.name,
    avatar: object.profile_image_url_https.replace('_normal.', '.')
  }) || undefined;
}

function _pruneTweets(tweets) {
  return tweets.map(function(tweet) {
    return {
      id: tweet.id,
      author: _getUserObjectFrom(tweet.user || tweet.sender),
      rcpt: _getUserObjectFrom(tweet.recipient),
      date: tweet.created_at,
      text: tweet.text
      // meta: {},
      // media
    };
  });
}

function _onSuccess(defer) {
  return function(data) {
    var tweets = _pruneTweets(JSON.parse(data));
    defer.resolve(tweets);
  };
}

function _getMentionsTimelinePromise(client, options) {
  var defer = q.defer();
  client.getMentionsTimeline(options, defer.reject, _onSuccess(defer));
  return defer.promise;
}

function _getDirectMessagesPromise(client, options) {
  var defer = q.defer();
  client.getCustomApiCall('/direct_messages.json', options, defer.reject, _onSuccess(defer));
  return defer.promise;
}

function getTweets(twitterConfig, options) {
  var twitter = new Twitter(twitterConfig);

  return q.all([
    _getMentionsTimelinePromise(twitter, { count: '1'}),
    _getDirectMessagesPromise(twitter, { count: '1'})
  ]).then(function(results) {
    return q.resolve(results[0].concat(results[1]));
  });
}

module.exports = {
  getTweets: getTweets
};
