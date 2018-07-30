const CONSTANTS = require('../lib/constants');
const NAMESPACE = '/contacts';
let initialized = false;
let contactNamespace;

module.exports = {
  init
};

function init(dependencies) {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub').local;
  const io = dependencies('wsserver').io;

  if (initialized) {
    logger.warn('The contact notification service is already initialized');

    return;
  }

  pubsub.topic(CONSTANTS.NOTIFICATIONS.CONTACT_DELETED).subscribe(_onContactDeleted);
  pubsub.topic(CONSTANTS.NOTIFICATIONS.CONTACT_UPDATED).subscribe(_onContactUpdated);
  pubsub.topic(CONSTANTS.NOTIFICATIONS.CONTACT_ADDED).subscribe(_onContactAdded);
  pubsub.topic(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_CREATED).subscribe(_onAddressbookCreated);
  pubsub.topic(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_DELETED).subscribe(_onAddressbookDeleted);
  pubsub.topic(CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_SUBSCRIPTION_DELETED).subscribe(_onAddressbookSubscriptionDeleted);

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

  ///////////////////////////////

  function _synchronizeContactLists(event, data) {
    if (contactNamespace) {
      contactNamespace.to(data.bookId).emit(event, {
        room: data.bookId,
        data: data
      });
    }
  }

  function _shouldSkipNotification(data) {
    return data && data.mode === CONSTANTS.MODE.IMPORT;
  }

  function _onContactDeleted(data) {
    if (_shouldSkipNotification(data)) {
      return logger.info('Contact delete notification is skipped');
    }

    if (data && data.bookId && data.bookName && data.contactId) {
      logger.info('Notifying contact delete');
      _synchronizeContactLists('contact:deleted', {
        bookId: data.bookId,
        bookName: data.bookName,
        contactId: data.contactId
      });
    } else {
      logger.warn('Not well-formed data on', CONSTANTS.NOTIFICATIONS.CONTACT_DELETED, 'pubsub event');
    }
  }

  function _onContactUpdated(data) {
    if (_shouldSkipNotification(data)) {
      return logger.info('Contact update notification is skipped');
    }

    if (data && data.bookId && data.bookName && data.contactId) {
      logger.info('Notifying contact update');
      _synchronizeContactLists('contact:updated', {
        bookId: data.bookId,
        bookName: data.bookName,
        contactId: data.contactId
      });
    } else {
      logger.warn('Not well-formed data on', CONSTANTS.NOTIFICATIONS.CONTACT_UPDATED, 'pubsub event');
    }
  }

  function _onContactAdded(data) {
    if (_shouldSkipNotification(data)) {
      return logger.info('Contact add notification is skipped');
    }

    if (data && data.bookId && data.bookName && data.vcard) {
      logger.info('Notifying contact creation');
      _synchronizeContactLists('contact:created', {
        bookId: data.bookId,
        bookName: data.bookName,
        vcard: data.vcard
      });
    } else {
      logger.warn('Not well-formed data on', CONSTANTS.NOTIFICATIONS.CONTACT_ADDED, 'pubsub event');
    }
  }

  function _onAddressbookCreated(data) {
    if (data && data.bookId && data.bookName) {
      logger.info('Notifying address book created');

      _synchronizeContactLists('contact:addressbook:created', {
        bookId: data.bookId,
        bookName: data.bookName
      });
    } else {
      logger.warn('Not well-formed data on', CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_CREATED, 'pubsub event');
    }
  }

  function _onAddressbookDeleted(data) {
    if (data && data.bookId && data.bookName) {
      logger.info('Notifying address book deleted');

      _synchronizeContactLists('contact:addressbook:deleted', {
        bookId: data.bookId,
        bookName: data.bookName
      });
    } else {
      logger.warn('Not well-formed data on', CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_DELETED, 'pubsub event');
    }
  }

  function _onAddressbookSubscriptionDeleted(data) {
    if (data && data.bookId && data.bookName) {
      logger.info('Notifying address book subscription deleted');

      _synchronizeContactLists('contact:addressbook:subscription:deleted', {
        bookId: data.bookId,
        bookName: data.bookName
      });
    } else {
      logger.warn('Not well-formed data on', CONSTANTS.NOTIFICATIONS.ADDRESSBOOK_SUBSCRIPTION_DELETED, 'pubsub event');
    }
  }
}
