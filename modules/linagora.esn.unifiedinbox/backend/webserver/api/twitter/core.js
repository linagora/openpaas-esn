'use strict';

var Twitter = require('twit');
var q = require('q');

function _getUserObjectFrom(object) {
  return (object && {
    id: object.id,
    displayName: object.name,
    avatar: object.profile_image_url_https,
    screenName: '@' + object.screen_name
  }) || undefined;
}

function _pruneTweets(tweets) {
  return tweets.map(function(tweet) {
    return {
      id: tweet.id,
      author: _getUserObjectFrom(tweet.user || tweet.sender),
      rcpt: _getUserObjectFrom(tweet.recipient),
      date: new Date(tweet.created_at),
      text: tweet.text
    };
  });
}

function _getMentionsTimelinePromise(client, options) {
  return q.ninvoke(client, 'get', '/statuses/mentions_timeline', options).then(data => _pruneTweets(data[0]));
}

function _getDirectMessagesPromise(client, options) {
  return q.ninvoke(client, 'get', '/direct_messages', options).then(data => _pruneTweets(data[0]));
}

function getTweets(twitterConfig, options) {
  var twitter = new Twitter(twitterConfig);
  return q.all([
    _getMentionsTimelinePromise(twitter, options),
    _getDirectMessagesPromise(twitter, options)
  ]).then(function(results) {
    return q.resolve(results[0].concat(results[1]));
  });
}

module.exports = {
  getTweets: getTweets
};
