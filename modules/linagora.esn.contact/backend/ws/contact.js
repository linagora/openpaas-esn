'use strict';

var CONSTANTS = require('../lib/constants');
var initialized = false;
var NAMESPACE = '/contacts';
var contactNamespace;

function init(dependencies) {
  var logger = dependencies('logger');
  var pubsub = dependencies('pubsub').local;
  var io = dependencies('wsserver').io;

  function shouldSkipNotification(data) {
    return data && data.mode && data.mode && data.mode === CONSTANTS.MODE.IMPORT;
  }

  function synchronizeContactLists(event, data) {
    if (contactNamespace) {
      contactNamespace.to(data.bookId).emit(event, {
        room: data.bookId,
        data: data
      });
    }
  }

  if (initialized) {
    logger.warn('The contact notification service is already initialized');
    return;
  }

  pubsub.topic(CONSTANTS.NOTIFICATIONS.CONTACT_DELETED).subscribe(function(data) {
    if (shouldSkipNotification(data)) {
      return logger.info('Contact delete notification is skipped');
    }

    if (data && data.bookId && data.bookName && data.contactId) {
      logger.info('Notifying contact delete');
      synchronizeContactLists('contact:deleted', {
        bookId: data.bookId,
        bookName: data.bookName,
        contactId: data.contactId
      });
    } else {
      logger.warn('Not well-formed data on', CONSTANTS.NOTIFICATIONS.CONTACT_DELETED, 'pubsub event');
    }

  });

  pubsub.topic(CONSTANTS.NOTIFICATIONS.CONTACT_UPDATED).subscribe(function(data) {

    if (shouldSkipNotification(data)) {
      return logger.info('Contact update notification is skipped');
    }

    if (data && data.bookId && data.bookName && data.contactId) {
      logger.info('Notifying contact update');
      synchronizeContactLists('contact:updated', {
        bookId: data.bookId,
        bookName: data.bookName,
        contactId: data.contactId
      });
    } else {
      logger.warn('Not well-formed data on', CONSTANTS.NOTIFICATIONS.CONTACT_UPDATED, 'pubsub event');
    }
  });

  pubsub.topic(CONSTANTS.NOTIFICATIONS.CONTACT_ADDED).subscribe(function(data) {
    if (shouldSkipNotification(data)) {
      return logger.info('Contact add notification is skipped');
    }

    if (data && data.bookId && data.bookName && data.vcard) {
      logger.info('Notifying contact creation');
      synchronizeContactLists('contact:created', {
        bookId: data.bookId,
        bookName: data.bookName,
        vcard: data.vcard
      });
    } else {
      logger.warn('Not well-formed data on', CONSTANTS.NOTIFICATIONS.CONTACT_ADDED, 'pubsub event');
    }

  });

  pubsub.topic(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_DELETED).subscribe(data => {
    if (data && data.bookId && data.bookName) {
      logger.info('Notifying address book deleted');

      synchronizeContactLists('contact:addressbook:deleted', {
        bookId: data.bookId,
        bookName: data.bookName
      });
    } else {
      logger.warn('Not well-formed data on', CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_DELETED, 'pubsub event');
    }
  });

  contactNamespace = io.of(NAMESPACE);
  contactNamespace.on('connection', function(socket) {
    logger.info('New connection on ' + NAMESPACE);

    socket.on('subscribe', function(bookId) {
      logger.info('Joining contact room', bookId);
      socket.join(bookId);
    });

    socket.on('unsubscribe', function(bookId) {
      logger.info('Leaving contact room', bookId);
      socket.leave(bookId);
    });
  });

  initialized = true;
}

module.exports.init = init;
