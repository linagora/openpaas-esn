'use strict';

var async = require('async'),
    localpubsub = require('../pubsub').local,
    globalpubsub = require('../pubsub').global,
    logger = require('../logger'),
    usernotification = require('./usernotification'),
    communityModule = require('../community'),
    extend = require('extend'),
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
      logger.warn('Error while adding a usernotification : ', err.message);
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
    target: data.target
  };
  return callback(null, notification);
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
    target: data.manager
  };
  return callback(null, notification);
}

function communityJoinHandler(data, callback) {
  if (data.actor === 'manager') {
    async.waterfall([
        augmentToMembershipAccepted.bind(null, data),
        createUserNotification
      ],
      onSuccessPublishIntoGlobal(callback));
  } else {

    communityModule.getManagers(data.community, {}, function(err, managers) {
      if (err || !managers || managers.legnth === 0) {
        logger.warn('Notification could not be created : no target user found.');
        return;
      }
      managers.forEach(function(manager) {
        var notifData = {
          manager: manager._id
        };
        extend(notifData, data);
        async.waterfall([
            augmentToCommunityJoin.bind(null, notifData),
            createUserNotification
          ],
          onSuccessPublishIntoGlobal(callback));
      });
    });
  }
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
    target: data.target
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
  var authorId = data.author._id || data.author;
  var communityId = data.community._id || data.community;
  var notification = {
    subject: {objectType: 'user', id: authorId},
    verb: {label: 'ESN_MEMBERSHIP_REQUEST', text: 'requested membership on'},
    complement: {objectType: 'community', id: communityId},
    context: null,
    description: null,
    icon: {objectType: 'icon', id: 'fa-users'},
    category: 'community:membership:request',
    interactive: true,
    target: data.manager
  };
  return callback(null, notification);
}

function membershipRequestHandler(data, callback) {
  communityModule.getManagers(data.community, {}, function(err, managers) {
    if (err || !managers || managers.legnth === 0) {
      logger.warn('Notification could not be created : no target user found.');
      return;
    }
    managers.forEach(function(manager) {
      var notifData = {
        manager: manager._id
      };
      extend(notifData, data);
      async.waterfall([
          augmentToMembershipRequest.bind(null, notifData),
          createUserNotification
        ],
        onSuccessPublishIntoGlobal(callback));
    });
  });
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

function augmentToMembershipRefused(data, callback) {
  var notification = {
    subject: {objectType: 'user', id: data.author},
    verb: {label: 'ESN_MEMBERSHIP_REFUSED', text: 'declined your request to join'},
    complement: {objectType: 'community', id: data.community},
    context: null,
    description: null,
    icon: {objectType: 'icon', id: 'fa-users'},
    category: 'community:membership:refused',
    read: false,
    interactive: false,
    target: data.target
  };
  return callback(null, notification);
}

function membershipRequestRefuseHandler(data, callback) {
  async.waterfall([
      augmentToMembershipRefused.bind(null, data),
      createUserNotification
    ],
    onSuccessPublishIntoGlobal(callback));
}
module.exports.membershipRequestRefuseHandler = membershipRequestRefuseHandler;

function membershipInvitationCancelHandler(data) {
  var query = {
    category: 'community:membership:invite',
    'complement.objectType': 'community',
    'complement.id': data.community,
    target: data.target
  };
  usernotification.remove(query, function(err) {
    if (err) {
      logger.error('Unable to remove community invitation usernotification: ' + err.message);
    }
  });
}

function init() {
  if (initialized) {
    logger.warn('Notification Pubsub is already initialized');
    return;
  }
  localpubsub.topic('community:join').subscribe(communityJoinHandler);
  localpubsub.topic('community:membership:invite').subscribe(membershipInviteHandler);
  localpubsub.topic('community:membership:request').subscribe(membershipRequestHandler);
  localpubsub.topic('community:membership:invitation:cancel').subscribe(membershipInvitationCancelHandler);
  localpubsub.topic('community:membership:request:refuse').subscribe(membershipRequestRefuseHandler);
  initialized = true;
}
module.exports.init = init;
