'use strict';

const ICAL = require('@linagora/ical.js');
const { GLOBAL_PUBSUB_EVENTS, NOTIFICATIONS } = require('../constants');
const helper = require('./helper');

module.exports = dependencies => {
  const pubsub = dependencies('pubsub');
  const logger = dependencies('logger');

  return {
    listen
  };

  function listen() {
    logger.info('Listening on global pubsub event of contacts');

    pubsub.global.topic(GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED).subscribe(onContactAdded);
    pubsub.global.topic(GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED).subscribe(onContactUpdated);
    pubsub.global.topic(GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_MOVED).subscribe(onContactMoved);
    pubsub.global.topic(GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED).subscribe(onContactDeleted);

    pubsub.global.topic(GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_DELETED).subscribe(onAddressbookDeleted);
    pubsub.global.topic(GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_DELETED).subscribe(onAddressbookSubscriptionDeleted);

    function onContactAdded(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED, msg.path);

      const parsedPath = helper.parseCardPath(msg.path);
      const userId = helper.parseOwner(msg.owner);

      pubsub.local.topic(NOTIFICATIONS.CONTACT_ADDED).publish({
        userId,
        contactId: parsedPath.cardId,
        bookId: parsedPath.bookHome,
        bookName: parsedPath.bookName,
        vcard: ICAL.Component.fromString(msg.carddata)
      });
    }

    function onContactUpdated(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED, msg.path);

      const parsedPath = helper.parseCardPath(msg.path);
      const userId = helper.parseOwner(msg.owner);

      pubsub.local.topic(NOTIFICATIONS.CONTACT_UPDATED).publish({
        userId,
        contactId: parsedPath.cardId,
        bookId: parsedPath.bookHome,
        bookName: parsedPath.bookName,
        vcard: ICAL.Component.fromString(msg.carddata)
      });
    }

    function onContactMoved(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_MOVED, msg.path, msg.toPath);

      const parsedPath = helper.parseCardPath(msg.toPath);
      const userId = helper.parseOwner(msg.owner);

      pubsub.local.topic(NOTIFICATIONS.CONTACT_UPDATED).publish({
        userId,
        contactId: parsedPath.cardId,
        bookId: parsedPath.bookHome,
        bookName: parsedPath.bookName,
        vcard: ICAL.Component.fromString(msg.carddata)
      });
    }

    function onContactDeleted(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED, msg.path);

      const parsedPath = helper.parseCardPath(msg.path);

      pubsub.local.topic(NOTIFICATIONS.CONTACT_DELETED).publish({
        contactId: parsedPath.cardId,
        bookId: parsedPath.bookHome,
        bookName: parsedPath.bookName
      });
    }

    function onAddressbookDeleted(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_DELETED, msg);

      const userId = helper.parseOwner(msg.owner);
      const parsedPath = helper.parseAddressbookPath(msg.path);

      pubsub.local.topic(NOTIFICATIONS.ADDRESSBOOK_DELETED).publish({
        userId,
        bookId: parsedPath.bookHome,
        bookName: parsedPath.bookName
      });
    }

    function onAddressbookSubscriptionDeleted(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_DELETED, msg);

      const userId = helper.parseOwner(msg.owner);
      const parsedPath = helper.parseAddressbookPath(msg.path);

      pubsub.local.topic(NOTIFICATIONS.ADDRESSBOOK_SUBSCRIPTION_DELETED).publish({
        userId,
        bookId: parsedPath.bookHome,
        bookName: parsedPath.bookName
      });
    }
  }
};
