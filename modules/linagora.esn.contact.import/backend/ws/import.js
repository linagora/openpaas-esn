'use strict';

var NAMESPACE = '/contact-import';
var CONTACT_IMPORT_ERROR = require('../constants').CONTACT_IMPORT_ERROR;

var IMPORT_ACCOUNT_ERROR = CONTACT_IMPORT_ERROR.ACCOUNT_ERROR;
var IMPORT_API_CLIENT_ERROR = CONTACT_IMPORT_ERROR.API_CLIENT_ERROR;
var IMPORT_CONTACT_CLIENT_ERROR = CONTACT_IMPORT_ERROR.CONTACT_CLIENT_ERROR;

var initialized = false;
var importNamespace;

function init(dependencies) {
  var logger = dependencies('logger');
  var pubsub = dependencies('pubsub').global;
  var io = dependencies('wsserver').io;

  if (initialized) {
    logger.warn('The contact import notification service is already initialized');
    return;
  }

  function notify(eventName, data) {
    if (!data.user || !data.user._id) {
      logger.warn('Notifing %s to unknown user', eventName);
      return;
    }
    var userId = data.user.id;
    importNamespace.to(userId).emit(eventName, {
      room: userId,
      data: {
        account: data.account,
        provider: data.provider
      }
    });
    logger.debug('Notifing %s to sockets in room %s', eventName, userId);
  }

  pubsub.topic(IMPORT_ACCOUNT_ERROR).subscribe(function(data) {
    notify(IMPORT_ACCOUNT_ERROR, data);
  });

  pubsub.topic(IMPORT_API_CLIENT_ERROR).subscribe(function(data) {
    notify(IMPORT_API_CLIENT_ERROR, data);
  });

  pubsub.topic(IMPORT_CONTACT_CLIENT_ERROR).subscribe(function(data) {
    notify(IMPORT_CONTACT_CLIENT_ERROR, data);
  });

  importNamespace = io.of(NAMESPACE);
  importNamespace.on('connection', function(socket) {
    logger.info('New connection on ' + NAMESPACE);

    socket.on('subscribe', function(userId) {
      logger.info('User', userId, ': new connection on', NAMESPACE);
      socket.join(userId);
    });

    socket.on('unsubscribe', function(userId) {
      logger.info('User', userId, ': closed connection on', NAMESPACE);
      socket.leave(userId);
    });
  });

  initialized = true;
}

module.exports.init = init;
