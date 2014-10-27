'use strict';

var async = require('async'),
    localpubsub = require('../pubsub').local,
    globalpubsub = require('../pubsub').global,
    logger = require('../logger'),
    usernotification = require('./usernotification'),
    initialized = false;

function createUserNotification(data, callback) {
  if (!data) {
    logger.warn('Can not create usernotification from null data');
    return;
  }
  usernotification.create(data, callback);
}

function onSuccessPublishIntoGlobal(callback) {
  callback = callback || function() {};
  return function(err, result) {
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
  };
}

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

function communityJoinHandler(data, callback) {
  async.waterfall([
    augmentToCommunityJoin.bind(null, data),
    createUserNotification
  ],
    onSuccessPublishIntoGlobal(callback));
}
module.exports.communityJoinHandler = communityJoinHandler;

function augmentToMembershipInvite(data, callback) {
  var notification = {
    subject: {objectType: 'user', id: data.author},
    verb: {label: 'ESN_MEMBERSHIP_INVITE', text: 'has invited you in'},
    complement: {objectType: 'community', id: data.community},
    context: null,
    description: null,
    icon: {objectType: 'icon', id: 'fa-users'},
    category: 'community:membership:invite',
    interactive: true,
    target: [{objectType: 'user', id: data.target}]
  };
  return callback(null, notification);
}

function membershipInviteHandler(data, callback) {
  async.waterfall([
      augmentToMembershipInvite.bind(null, data),
      createUserNotification
    ],
    onSuccessPublishIntoGlobal(callback));
}
module.exports.membershipInviteHandler = membershipInviteHandler;

function augmentToMembershipRequest(data, callback) {
  var notification = {
    subject: {objectType: 'user', id: data.author},
    verb: {label: 'ESN_MEMBERSHIP_REQUEST', text: 'requested membership on'},
    complement: {objectType: 'community', id: data.community},
    context: null,
    description: null,
    icon: {objectType: 'icon', id: 'fa-users'},
    category: 'community:membership:request',
    interactive: true,
    target: [{objectType: 'community', id: data.community}]
  };
  return callback(null, notification);
}

function augmentToMembershipAccepted(data, callback) {

  var notification = {
    subject: {objectType: 'user', id: data.author},
    verb: {label: 'ESN_MEMBERSHIP_ACCEPTED', text: 'accepted your request to join'},
    complement: {objectType: 'community', id: data.community},
    context: null,
    description: null,
    icon: {objectType: 'icon', id: 'fa-users'},
    category: 'community:membership:accepted',
    read: false,
    interactive: false,
    target: [{objectType: 'user', id: data.target + ''}]
  };
  return callback(null, notification);
}

function membershipRequestHandler(data, callback) {
  async.waterfall([
      augmentToMembershipRequest.bind(null, data),
      createUserNotification
    ],
    onSuccessPublishIntoGlobal(callback));
}
module.exports.membershipRequestHandler = membershipRequestHandler;

function membershipAcceptedHandler(data, callback) {
  async.waterfall([
      augmentToMembershipAccepted.bind(null, data),
      createUserNotification
    ],
    onSuccessPublishIntoGlobal(callback));
}
module.exports.membershipAcceptedHandler = membershipAcceptedHandler;

function init() {
  if (initialized) {
    logger.warn('Activity Stream Pubsub is already initialized');
    return;
  }
  localpubsub.topic('community:join').subscribe(communityJoinHandler);
  localpubsub.topic('community:membership:invite').subscribe(membershipInviteHandler);
  localpubsub.topic('community:membership:request').subscribe(membershipRequestHandler);
  localpubsub.topic('community:membership:accepted').subscribe(membershipAcceptedHandler);
  initialized = true;
}
module.exports.init = init;
