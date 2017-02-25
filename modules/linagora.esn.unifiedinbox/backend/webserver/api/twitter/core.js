'use strict';

const Twitter = require('twit'),
      q = require('q');

module.exports = {
  getDirectMessages,
  getMentions
};

/////

function getMentions(config, options) {
  return q.ninvoke(new Twitter(config), 'get', '/statuses/mentions_timeline', options).then(data => _formatTweets(data[0]));
}

function getDirectMessages(config, options) {
  return q.ninvoke(new Twitter(config), 'get', '/direct_messages', options).then(data => _formatTweets(data[0]));
}

function _formatTwitterUser(object) {
  if (object) {
    return {
      id: object.id,
      displayName: object.name,
      avatar: object.profile_image_url_https,
      screenName: '@' + object.screen_name
    };
  }
}

function _formatTweets(tweets) {
  return tweets.map(tweet => ({
    id: tweet.id,
    author: _formatTwitterUser(tweet.user || tweet.sender),
    rcpt: _formatTwitterUser(tweet.recipient),
    date: new Date(tweet.created_at),
    text: tweet.text
  }));
}
