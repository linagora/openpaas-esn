'use strict';

var async = require('async'),
    localpubsub = require('../pubsub').local,
    globalpubsub = require('../pubsub').global,
    logger = require('../logger'),
    usernotification = require('./usernotification'),
    initialized = false;

function augmentToCommunityJoin(data, callback) {
  var notification = {
    subject: {objectType: 'user', id: data.author},
    verb: {label: 'ESN_COMMUNITY_JOIN', text: 'has joined'},
    complement: {objectType: 'community', id: data.community},
    context: null,
    description: null,
    icon: {objectType: 'icon', id: 'fa-users'},
    category: 'community:join',
    target: [{objectType: 'community', id: data.community}]
  };
  return callback(null, notification);
}

function createUserNotification(data, callback) {
  if (!data) {
    logger.warn('Can not create usernotification from null data');
    return;
  }
  usernotification.addUserNotification(data, callback);
}

function communityJoinHandler(data, callback) {
  async.waterfall([
    augmentToCommunityJoin.bind(null, data),
    createUserNotification
  ], function(err, result) {
    if (err) {
      logger.warn('Error while adding a usernotification : ', + err.message);
      callback(err);
    } else {
      if (result) {
        logger.debug('A new usernotification has been saved : ' + result._id);
        globalpubsub.topic('usernotification:created').publish(result);
      }
      return callback(null);
    }
  });
}
module.exports.communityJoinHandler = communityJoinHandler;

function init() {
  if (initialized) {
    logger.warn('Activity Stream Pubsub is already initialized');
    return;
  }
  localpubsub.topic('community:join').subscribe(communityJoinHandler);
  initialized = true;
}
module.exports.init = init;
