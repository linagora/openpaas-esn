'use strict';

var async = require('async'),
    localpubsub = require('../pubsub').local,
    globalpubsub = require('../pubsub').global,
    logger = require('../logger'),
    usernotification = require('./usernotification'),
    collaborationModule = require('../collaboration'),
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
  var id = data.community || data.collaboration.id;
  var notification = {
    subject: {objectType: 'user', id: data.author},
    verb: {label: 'ESN_MEMBERSHIP_ACCEPTED', text: 'accepted your request to join'},
    complement: {objectType: data.collaboration.objectType, id: id},
    context: null,
    description: null,
    icon: {objectType: 'icon', id: 'fa-users'},
    category: 'collaboration:membership:accepted',
    read: false,
    interactive: false,
    target: data.target
  };
  return callback(null, notification);
}

function augmentToCollaborationJoin(data, callback) {
  var id = data.community || data.collaboration.id;
  var notification = {
    subject: {objectType: 'user', id: data.author},
    verb: {label: 'ESN_COMMUNITY_JOIN', text: 'has joined'},
    complement: {objectType: data.collaboration.objectType, id: id},
    context: null,
    description: null,
    icon: {objectType: 'icon', id: 'fa-users'},
    category: 'collaboration:join',
    target: data.manager
  };
  return callback(null, notification);
}

function collaborationJoinHandler(data, callback) {
  if (data.actor === 'manager') {
    async.waterfall([
        augmentToMembershipAccepted.bind(null, data),
        createUserNotification
      ],
      onSuccessPublishIntoGlobal(callback));
  } else {

    collaborationModule.getManagers(data.collaboration.objectType, data.collaboration.id, {}, function(err, managers) {
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
            augmentToCollaborationJoin.bind(null, notifData),
            createUserNotification
          ],
          onSuccessPublishIntoGlobal(callback));
      });
    });
  }
}
module.exports.collaborationJoinHandler = collaborationJoinHandler;

function augmentToMembershipInvite(data, callback) {
  var id = data.community || data.collaboration.id;
  var notification = {
    subject: {objectType: 'user', id: data.author},
    verb: {label: 'ESN_MEMBERSHIP_INVITE', text: 'has invited you in'},
    complement: {objectType: data.collaboration.objectType, id: id},
    context: null,
    description: null,
    icon: {objectType: 'icon', id: 'fa-users'},
    category: 'collaboration:membership:invite',
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

function membershipAcceptedHandler(data, callback) {
  async.waterfall([
      augmentToMembershipAccepted.bind(null, data),
      createUserNotification
    ],
    onSuccessPublishIntoGlobal(callback));
}
module.exports.membershipAcceptedHandler = membershipAcceptedHandler;

function augmentToMembershipRefused(data, callback) {
  var id = data.community || data.collaboration.id;
  var notification = {
    subject: {objectType: 'user', id: data.author},
    verb: {label: 'ESN_MEMBERSHIP_REFUSED', text: 'declined your request to join'},
    complement: {objectType: data.collaboration.objectType, id: id},
    context: null,
    description: null,
    icon: {objectType: 'icon', id: 'fa-users'},
    category: 'collaboration:membership:refused',
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
  var id = data.community || data.collaboration.id;
  var query = {
    category: 'collaboration:membership:invite',
    'complement.objectType': data.collaboration.objectType,
    'complement.id': id,
    target: data.target
  };
  usernotification.remove(query, function(err) {
    if (err) {
      logger.error('Unable to remove community invitation usernotification: ' + err.message);
    }
  });
}

function augmentToExternalNotification(data, callback) {
  var context = data.context;
  if (context) {
    context = {objectType: 'community', id: context};
  }
  var notification = {
    subject: {objectType: 'user', id: data.author},
    verb: {label: data.action, text: data.action},
    complement: {objectType: 'string', id: data.object},
    context: context,
    description: null,
    icon: null,
    category: 'external',
    read: false,
    interactive: false,
    target: data.target,
    action: [{
      url: data.link,
      display: {label: 'ESN_LINK', text: 'link'}
    }]
  };
  return callback(null, notification);
}

function externalNotificationHandler(data) {
  async.waterfall([
      augmentToExternalNotification.bind(null, data),
      createUserNotification
    ],
    onSuccessPublishIntoGlobal());
}

function init() {
  if (initialized) {
    logger.warn('Notification Pubsub is already initialized');
    return;
  }
  localpubsub.topic('collaboration:join').subscribe(collaborationJoinHandler);
  localpubsub.topic('collaboration:membership:invite').subscribe(membershipInviteHandler);
  localpubsub.topic('collaboration:membership:invitation:cancel').subscribe(membershipInvitationCancelHandler);
  localpubsub.topic('collaboration:membership:request:refuse').subscribe(membershipRequestRefuseHandler);
  localpubsub.topic('notification:external').subscribe(externalNotificationHandler);
  initialized = true;
}
module.exports.init = init;
