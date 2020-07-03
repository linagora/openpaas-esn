const ICAL = require('@linagora/ical.js');
const { GLOBAL_PUBSUB_EVENTS, NOTIFICATIONS, ELASTICSEARCH_EVENTS } = require('../constants');
const {
  parseAddressbookPath,
  parseContactPath
} = require('./helper');
const { parsePrincipal } = require('../helper');

module.exports = dependencies => {
  const pubsub = dependencies('pubsub');
  const logger = dependencies('logger');
  const { pointToPoint } = dependencies('messaging');

  return {
    listen
  };

  function listen() {
    logger.info('Listening on point to point message of contacts');

    pointToPoint.get(GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED).receive(onContactAdded);
    pointToPoint.get(GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED).receive(onContactUpdated);
    pointToPoint.get(GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED).receive(onContactDeleted);
    pointToPoint.get(GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_CREATED).receive(onAddressbookCreated);
    pointToPoint.get(GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_DELETED).receive(onAddressbookDeleted);
    pointToPoint.get(GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_UPDATED).receive(onAddressbookUpdated);
    pointToPoint.get(GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_DELETED).receive(onAddressbookSubscriptionDeleted);
    pointToPoint.get(GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_UPDATED).receive(onAddressbookSubscriptionUpdated);
    pointToPoint.get(GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_CREATED).receive(onAddressbookSubscriptionCreated);

    function parseContact(msg) {
      const data = parseContactPath(msg.path);

      if (msg.owner) {
        data.userId = parsePrincipal(msg.owner).id;
      }

      if (msg.carddata) {
        data.vcard = ICAL.Component.fromString(msg.carddata);
      }

      return data;
    }

    function parseAddressbook(msg) {
      const data = parseAddressbookPath(msg.path);

      if (msg.owner) {
        data.userId = parsePrincipal(msg.owner).id;
      }

      return data;
    }

    function onContactAdded(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED, msg.path);

      const data = parseContact(msg);

      shouldPublishElasticsearchMessage(msg) && pubsub.local.topic(ELASTICSEARCH_EVENTS.CONTACT_ADDED).publish(data);
      pubsub.global.topic(NOTIFICATIONS.CONTACT_ADDED).publish(data);
    }

    function onContactUpdated(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED, msg.path);

      const data = parseContact(msg);

      shouldPublishElasticsearchMessage(msg) && pubsub.local.topic(ELASTICSEARCH_EVENTS.CONTACT_UPDATED).publish(data);
      pubsub.global.topic(NOTIFICATIONS.CONTACT_UPDATED).publish(data);
    }

    function onContactDeleted(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED, msg.path);

      const data = parseContact(msg);

      shouldPublishElasticsearchMessage(msg) && pubsub.local.topic(ELASTICSEARCH_EVENTS.CONTACT_DELETED).publish(data);
      pubsub.global.topic(NOTIFICATIONS.CONTACT_DELETED).publish(data);
    }

    function onAddressbookCreated(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_CREATED, msg);

      pubsub.global.topic(NOTIFICATIONS.ADDRESSBOOK_CREATED).publish(parseAddressbook(msg));
    }

    function onAddressbookDeleted(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_DELETED, msg);

      pubsub.global.topic(NOTIFICATIONS.ADDRESSBOOK_DELETED).publish(parseAddressbook(msg));
    }

    function onAddressbookUpdated(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_UPDATED, msg);

      pubsub.global.topic(NOTIFICATIONS.ADDRESSBOOK_UPDATED).publish(parseAddressbook(msg));
    }

    function onAddressbookSubscriptionDeleted(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_DELETED, msg);

      pubsub.global.topic(NOTIFICATIONS.ADDRESSBOOK_SUBSCRIPTION_DELETED).publish(parseAddressbook(msg));
    }

    function onAddressbookSubscriptionUpdated(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_UPDATED, msg);

      pubsub.global.topic(NOTIFICATIONS.ADDRESSBOOK_SUBSCRIPTION_UPDATED).publish(parseAddressbook(msg));
    }

    function onAddressbookSubscriptionCreated(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_CREATED, msg);

      pubsub.global.topic(NOTIFICATIONS.ADDRESSBOOK_SUBSCRIPTION_CREATED).publish(parseAddressbook(msg));
    }

    function shouldPublishElasticsearchMessage(message) {
      return !message.sourcePath && !message.groupAddressBook && message.path && message.path !== '/';
    }
  }
};
