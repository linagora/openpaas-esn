'use strict';

var OAUTH_CONFIG_KEY = 'oauth';
var TWITTER = 'twitter';
var q = require('q');
var Twitter = require('twitter-node-client').Twitter;
var TWITTER_LIMIT_ID_REQUEST = 18000;
var MAX_ID_PER_STACK = 100;

module.exports = function(dependencies) {

  var twitterToVcard = require('./mapping')(dependencies);
  var logger = dependencies('logger');
  var pubsub = dependencies('pubsub').local;
  var contactModule = dependencies('contact');
  var config = dependencies('esn-config');

  function createContact(vcard, options) {
    var contactId = vcard.getFirstPropertyValue('uid');
    return contactModule.lib.client({ ESNToken: options.esnToken })
      .addressbook(options.user._id)
      .contacts(contactId)
      .create(vcard.toJSON())
      .then(function() {
        pubsub.topic('contacts:contact:add').publish({contactId: contactId, bookId: options.user._id, vcard: vcard.toJSON(), user: options.user});
      }, function(err) {
        logger.error('Error while importing contact', err);
      });
  }

  function sendFollowingToDAV(twitterClient, options, ids) {
    var defer = q.defer();

    twitterClient.getCustomApiCall('/users/lookup.json', {user_id: ids}, function(err) {
      return defer.reject(err);
    }, function(data) {
      var userList = JSON.parse(data);
      q.all(userList.map(function(userJson) {
        var vcard = twitterToVcard.toVcard(userJson);
        return createContact(vcard, options);
      })).then(function() {
        return defer.resolve();
      }, function(err) {
        return defer.reject(err);
      });
    });
    return defer.promise;
  }

  /**
   * Divide id list to a stack of 100 (twitter API limit) and create contact
   * @param  {Object} followingIdsList  Array of following id
   * @param  {Object} twitterClient     A twitter-node-client
   * @param  {Object} options           Contains user from the request and token from middleware
   */

  function sendFollowingsToDAV(followingIdsList, twitterClient, options) {

    var idStack = [];

    followingIdsList.forEach(function(value, index) {
      var arrayIndex = Math.ceil(index / MAX_ID_PER_STACK);
      if (idStack[arrayIndex]) {
        idStack[arrayIndex] += ',' + value.toString();
      } else {
        idStack[arrayIndex] = value.toString();
      }
    });

    q.all(idStack.map(function(ids) {
      return sendFollowingToDAV(twitterClient, options, ids);
    }));
  }

  /**
   * Get all following id of twitter account, to be called recursively because we can get only 5000 following per request
   * @param  {Object} followingIdsList  Array of following id
   * @param  {Object} twitterClient     A twitter-node-client
   * @param  {Object} next_cursor       next_cursor in the respond of twitter API
   * @return {Promise}  An array of following id (max 18000)
   */

  function getFollowingsIds(followingIdsList, twitterClient, next_cursor) {

    var defer = q.defer();
    if (followingIdsList.length >= TWITTER_LIMIT_ID_REQUEST) {
      followingIdsList = followingIdsList.slice(0, TWITTER_LIMIT_ID_REQUEST - 1);
      return defer.resolve(followingIdsList);
    }

    twitterClient.getCustomApiCall('/friends/ids.json', {cursor: next_cursor}, function(err) {
      return defer.reject(err);
    }, function(data) {
      var result = JSON.parse(data);
      Array.prototype.push.apply(followingIdsList, result.ids);
      if (result.next_cursor === 0) {
        return defer.resolve(followingIdsList);
      } else {
        return getFollowingsIds(followingIdsList, twitterClient, result.next_cursor);
      }
    });

    return defer.promise;
  }

  /**
   * Import all following of twitter account
   * @param  {Object} options   Contains user from the request and token from middleware
   * @return {Promise}
   */

  function importContact(options) {
    var defer = q.defer();

    var accounts = options.user.accounts.filter(function(account) {
      return (account.type.toLowerCase() === OAUTH_CONFIG_KEY && account.data.provider === TWITTER);
    });

    var followingIdsList = [];

    config(OAUTH_CONFIG_KEY).get(function(err, oauth) {

      if (!(oauth && oauth.twitter)) {
        return defer.reject('Can not get ouath config');
      }

      var twitterConfig = {
        consumerKey: oauth.twitter.consumer_key,
        consumerSecret: oauth.twitter.consumer_secret,
        accessToken: accounts[0].data.token,
        accessTokenSecret: accounts[0].data.token_secret,
        callBackUrl: ''
      };
      var twitterClient = new Twitter(twitterConfig);

      getFollowingsIds(followingIdsList, twitterClient, -1).then(function(followingIdsList) {
        sendFollowingsToDAV(followingIdsList, twitterClient, options);
      }, function(err) {
        logger.error('Error while calling twitter API', err);
      });
      return defer.resolve();
    });
    return defer.promise;
  }

  return {
    importContact: importContact
  };

};
