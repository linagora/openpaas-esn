'use strict';

var OAUTH_CONFIG_KEY = 'oauth';
var q = require('q');
var Twitter = require('twit');
var TWITTER_LIMIT_ID_REQUEST = 18000;
var MAX_ID_PER_STACK = 100;
var TWITTER = 'twitter';
var TIMEOUT = 60 * 1000;

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
    return q.ninvoke(twitterClient, 'get', '/users/lookup', {user_id: ids})
      .then(data => {
        var userList = data[0];
        return q.all(userList.map(userJson => importContactClient.createContact(twitterToVcard.toVcard(userJson), options)));
      },
      err => q.reject(importContactClient.buildErrorMessage(IMPORT_API_CLIENT_ERROR, err))
    );
  }

  /**
   * Divide id list to a stack of 100 (twitter API limit) and create contact
   * @param  {Object} followingIdsList  Array of following id
   * @param  {Object} twitterClient     A twit client
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
   * @param  {Object} twitterClient     A twit client
   * @param  {Object} next_cursor       next_cursor in the respond of twitter API
   * @return {Promise}  An array of following id (max 18000)
   */

  function getFollowingsIds(followingIdsList, twitterClient, nextCursor) {
    if (followingIdsList.length >= TWITTER_LIMIT_ID_REQUEST) {
      followingIdsList = followingIdsList.slice(0, TWITTER_LIMIT_ID_REQUEST - 1);
      return q.resolve(followingIdsList);
    } else {
      return q.ninvoke(twitterClient, 'get', '/friends/ids', { next_cursor: nextCursor })
        .then(data => {
          data = data[0];
          Array.prototype.push.apply(followingIdsList, data.ids);
          if (data.next_cursor > 0) {
            return getFollowingsIds(followingIdsList, twitterClient, data.next_cursor);
          } else {
            return q.resolve(followingIdsList);
          }
        },
        err => q.reject(importContactClient.buildErrorMessage(IMPORT_API_CLIENT_ERROR, err))
      );
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
        consumer_key: oauth.twitter.consumer_key,
        consumer_secret: oauth.twitter.consumer_secret,
        access_token: account.data.token,
        access_token_secret: account.data.token_secret,
        timeout_ms: TIMEOUT
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
