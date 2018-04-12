'use strict';

const async = require('async');
const localpubsub = require('../pubsub').local;
const logger = require('../logger');
const usernotification = require('./usernotification');

let initialized = false;

module.exports = {
  init
};

function createUserNotification(data, callback) {
  if (!data) {
    logger.warn('Can not create usernotification from null data');

    return;
  }
  usernotification.create(data, callback);
}

function augmentToExternalNotification(data, callback) {
  let context = data.context;

  if (context) {
    context = {objectType: context.objectType || 'community', id: context.id || context};
  }

  const notification = {
    subject: {objectType: 'user', id: data.author},
    verb: {label: data.action, text: data.action},
    complement: {objectType: data.object.objectType || 'string', id: data.object.id || data.object},
    context: context,
    description: null,
    icon: {objectType: 'icon', id: data.icon},
    category: 'external',
    read: false,
    interactive: false,
    target: data.target,
    action: [{
      url: data.link,
      display: {label: 'ESN_LINK', text: 'link'}
    }]
  };

  callback(null, notification);
}

function externalNotificationHandler(data) {
  async.waterfall([
      augmentToExternalNotification.bind(null, data),
      createUserNotification
    ]);
}

function init() {
  if (initialized) {
    logger.warn('Notification Pubsub is already initialized');

    return;
  }

  localpubsub.topic('notification:external').subscribe(externalNotificationHandler);
  initialized = true;
}
