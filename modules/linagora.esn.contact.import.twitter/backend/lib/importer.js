'use strict';

var OAUTH_CONFIG_KEY = 'oauth';
var q = require('q');
var Twitter = require('twitter-node-client').Twitter;
var TWITTER_LIMIT_ID_REQUEST = 18000;
var MAX_ID_PER_STACK = 100;
var TWITTER = 'twitter';

module.exports = function(dependencies) {

  var twitterToVcard = require('./mapping')(dependencies);
  var logger = dependencies('logger');
  var pubsub = dependencies('pubsub');
  var localpubsub = pubsub.local;
  var globalpubsub = pubsub.global;
  var config = dependencies('esn-config');
  var CONTACT_IMPORT_ERROR = dependencies('contact-import').constants.CONTACT_IMPORT_ERROR;
  var importContactClient = dependencies('contact-import').lib.import;
  var IMPORT_API_CLIENT_ERROR = CONTACT_IMPORT_ERROR.API_CLIENT_ERROR;

  function sendFollowingToDAV(twitterClient, options, ids) {
    var defer = q.defer();
    twitterClient.getCustomApiCall('/users/lookup.json', {user_id: ids}, function(err) {
      return defer.reject(importContactClient.buildErrorMessage(IMPORT_API_CLIENT_ERROR, err));
    }, function(data) {
      var userList = JSON.parse(data);
      q.all(userList.map(function(userJson) {
        var vcard = twitterToVcard.toVcard(userJson);
        return importContactClient.createContact(vcard, options);
      })).then(defer.resolve, defer.reject);
    });
    return defer.promise;
  }

  /**
   * Divide id list to a stack of 100 (twitter API limit) and create contact
   * @param  {Object} followingIdsList  Array of following id
   * @param  {Object} twitterClient     A twitter-node-client
   * @param  {Object} options           Contains user from the request and token from middleware
   */

  function sendFollowingsToDAV(followingIdsList, twitterClient, options, notifyProcess) {

    var idStack = [];
    var processedStack = 0;
    followingIdsList.forEach(function(value, index) {
      var arrayIndex = Math.floor(index / MAX_ID_PER_STACK);
      if (idStack[arrayIndex]) {
        idStack[arrayIndex] += ',' + value.toString();
      } else {
        idStack[arrayIndex] = value.toString();
      }
    });

    return q.all(idStack.map(function(ids, index) {
      return sendFollowingToDAV(twitterClient, options, ids).then(function() {
        processedStack++;
        notifyProcess({message: 'Imported following stack ' + index, value: Math.round(processedStack * 100 / idStack.length)});
      });
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
    if (followingIdsList.length >= TWITTER_LIMIT_ID_REQUEST) {
      followingIdsList = followingIdsList.slice(0, TWITTER_LIMIT_ID_REQUEST - 1);
      return q.resolve(followingIdsList);
    } else {
      var defer = q.defer();
      twitterClient.getCustomApiCall('/friends/ids.json', {cursor: next_cursor}, function(err) {
        defer.reject(importContactClient.buildErrorMessage(IMPORT_API_CLIENT_ERROR, err));
      }, function(data) {
        var result = JSON.parse(data);
        Array.prototype.push.apply(followingIdsList, result.ids);
        if (result.next_cursor === 0) {
          defer.resolve(followingIdsList);
        } else {
          getFollowingsIds(followingIdsList, twitterClient, result.next_cursor)
            .then(defer.resolve, defer.reject);
        }
      });
      return defer.promise;
    }
  }

  /**
   * Import all following of twitter account
   * @param  {Object} options   Contains user from the request and token from middleware
   * @return {Promise}
   */

  function importContact(options) {
    var defer = q.defer();

    var account = options.account;
    var followingIdsList = [];

    config(OAUTH_CONFIG_KEY).get(function(err, oauth) {

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
      var twitterClient = new Twitter(twitterConfig);
      getFollowingsIds(followingIdsList, twitterClient, -1)
        .then(function(followingIdsList) {
          return sendFollowingsToDAV(followingIdsList, twitterClient, options, defer.notify);
        })
        .then(defer.resolve, function(err) {
          logger.error('Error while importing Twitter followings', err);
          localpubsub.topic(err.type).forward(globalpubsub, {
            type: err.type,
            provider: TWITTER,
            account: account.data.username,
            user: options.user
          });
          defer.reject(err);
        });
    });
    return defer.promise;
  }

  return {
    importContact: importContact
  };

};
