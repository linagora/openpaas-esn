'use strict';

const async = require('async');
const localpubsub = require('../pubsub').local;
const logger = require('../logger');
const usernotification = require('../notification').usernotification;
const extend = require('extend');
let initialized = false;

module.exports = collaborationModule => {
  return {
    collaborationJoinHandler,
    membershipAcceptedHandler,
    membershipInviteHandler,
    membershipRequestRefuseHandler,
    init
  };

  function createUserNotification(data, callback) {
    if (!data) {
      logger.warn('Can not create usernotification from null data');

      return;
    }
    usernotification.create(data, callback);
  }

  function augmentToMembershipAccepted(data, callback) {
    const id = data.community || data.collaboration.id;
    const notification = {
      subject: {objectType: 'user', id: data.author},
      verb: {label: 'ESN_MEMBERSHIP_ACCEPTED', text: 'accepted your request to join'},
      complement: {objectType: data.collaboration.objectType, id: id},
      context: null,
      description: null,
      icon: {objectType: 'icon', id: 'mdi-account-multiple'},
      category: 'collaboration:membership:accepted',
      read: false,
      interactive: false,
      target: data.target
    };

    callback(null, notification);
  }

  function augmentToCollaborationJoin(data, callback) {
    const id = data.community || data.collaboration.id;
    const notification = {
      subject: {objectType: 'user', id: data.author},
      verb: {label: 'ESN_COMMUNITY_JOIN', text: 'has joined'},
      complement: {objectType: data.collaboration.objectType, id: id},
      context: null,
      description: null,
      icon: {objectType: 'icon', id: 'mdi-account-multiple'},
      category: 'collaboration:join',
      target: data.manager
    };

    callback(null, notification);
  }

  function collaborationJoinHandler(data, callback) {
    if (data.actor === 'manager') {
      async.waterfall([
          augmentToMembershipAccepted.bind(null, data),
          createUserNotification
        ], callback);
    } else {
      collaborationModule.member.getManagers(data.collaboration.objectType, data.collaboration.id, (err, managers) => {
        if (err || !managers || managers.length === 0) {
          logger.warn('Notification could not be created : no target user found.');

          return;
        }

        managers.forEach(manager => {
          const notifData = {
            manager: manager._id
          };

          extend(notifData, data);
          async.waterfall([
              augmentToCollaborationJoin.bind(null, notifData),
              createUserNotification
            ], callback);
        });
      });
    }
  }

  function augmentToMembershipInvite(data, callback) {
    const id = data.community || data.collaboration.id;
    const notification = {
      subject: {objectType: 'user', id: data.author},
      verb: {label: 'ESN_MEMBERSHIP_INVITE', text: 'has invited you in'},
      complement: {objectType: data.collaboration.objectType, id: id},
      context: null,
      description: null,
      icon: {objectType: 'icon', id: 'mdi-account-multiple'},
      category: 'collaboration:membership:invite',
      interactive: true,
      target: data.target
    };

    callback(null, notification);
  }

  function membershipInviteHandler(data, callback) {
    async.waterfall([
        augmentToMembershipInvite.bind(null, data),
        createUserNotification
      ], callback);
  }

  function membershipAcceptedHandler(data, callback) {
    async.waterfall([
        augmentToMembershipAccepted.bind(null, data),
        createUserNotification
      ], callback);
  }

  function augmentToMembershipRefused(data, callback) {
    const id = data.community || data.collaboration.id;
    const notification = {
      subject: {objectType: 'user', id: data.author},
      verb: {label: 'ESN_MEMBERSHIP_REFUSED', text: 'declined your request to join'},
      complement: {objectType: data.collaboration.objectType, id: id},
      context: null,
      description: null,
      icon: {objectType: 'icon', id: 'mdi-account-multiple'},
      category: 'collaboration:membership:refused',
      read: false,
      interactive: false,
      target: data.target
    };

    callback(null, notification);
  }

  function membershipRequestRefuseHandler(data, callback) {
    async.waterfall([
        augmentToMembershipRefused.bind(null, data),
        createUserNotification
      ], callback);
  }

  function membershipInvitationCancelHandler(data) {
    const id = data.community || data.collaboration.id;
    const query = {
      category: 'collaboration:membership:invite',
      'complement.objectType': data.collaboration.objectType,
      'complement.id': id,
      target: data.target
    };

    usernotification.remove(query, err => {
      if (err) {
        logger.error('Unable to remove community invitation usernotification: ' + err.message);
      }
    });
  }

  function init() {
    if (initialized) {
      logger.warn('Collaboration user-notification pubsub is already initialized');

      return;
    }

    localpubsub.topic('collaboration:join').subscribe(collaborationJoinHandler);
    localpubsub.topic('collaboration:membership:invite').subscribe(membershipInviteHandler);
    localpubsub.topic('collaboration:membership:invitation:cancel').subscribe(membershipInvitationCancelHandler);
    localpubsub.topic('collaboration:membership:request:refuse').subscribe(membershipRequestRefuseHandler);
    initialized = true;
  }
};
