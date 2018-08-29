const ICAL = require('@linagora/ical.js');
const { GLOBAL_PUBSUB_EVENTS, NOTIFICATIONS, ELASTICSEARCH_EVENTS } = require('../constants');
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
    pubsub.global.topic(GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED).subscribe(onContactDeleted);
    pubsub.global.topic(GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_CREATED).subscribe(onAddressbookCreated);
    pubsub.global.topic(GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_DELETED).subscribe(onAddressbookDeleted);
    pubsub.global.topic(GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_UPDATED).subscribe(onAddressbookUpdated);
    pubsub.global.topic(GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_DELETED).subscribe(onAddressbookSubscriptionDeleted);
    pubsub.global.topic(GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_UPDATED).subscribe(onAddressbookSubscriptionUpdated);
    pubsub.global.topic(GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_CREATED).subscribe(onAddressbookSubscriptionCreated);

    function parseContact(msg) {
      const data = helper.parseContactPath(msg.path);

      if (msg.owner) {
        data.userId = helper.parseOwner(msg.owner);
      }

      if (msg.carddata) {
        data.vcard = ICAL.Component.fromString(msg.carddata);
      }

      return data;
    }

    function parseAddressbook(msg) {
      const data = helper.parseAddressbookPath(msg.path);

      if (msg.owner) {
        data.userId = helper.parseOwner(msg.owner);
      }

      return data;
    }

    function onContactAdded(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_CREATED, msg.path);

      const data = parseContact(msg);

      shouldPublishElasticsearchMessage(msg) && pubsub.local.topic(ELASTICSEARCH_EVENTS.CONTACT_ADDED).publish(data);
      pubsub.local.topic(NOTIFICATIONS.CONTACT_ADDED).publish(data);
    }

    function onContactUpdated(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_UPDATED, msg.path);

      const data = parseContact(msg);

      shouldPublishElasticsearchMessage(msg) && pubsub.local.topic(ELASTICSEARCH_EVENTS.CONTACT_UPDATED).publish(data);
      pubsub.local.topic(NOTIFICATIONS.CONTACT_UPDATED).publish(data);
    }

    function onContactDeleted(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.CONTACT_DELETED, msg.path);

      const data = parseContact(msg);

      shouldPublishElasticsearchMessage(msg) && pubsub.local.topic(ELASTICSEARCH_EVENTS.CONTACT_DELETED).publish(data);
      pubsub.local.topic(NOTIFICATIONS.CONTACT_DELETED).publish(data);
    }

    function onAddressbookCreated(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_CREATED, msg);

      pubsub.local.topic(NOTIFICATIONS.ADDRESSBOOK_CREATED).publish(parseAddressbook(msg));
    }

    function onAddressbookDeleted(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_DELETED, msg);

      pubsub.local.topic(NOTIFICATIONS.ADDRESSBOOK_DELETED).publish(parseAddressbook(msg));
    }

    function onAddressbookUpdated(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_UPDATED, msg);

      pubsub.local.topic(NOTIFICATIONS.ADDRESSBOOK_UPDATED).publish(parseAddressbook(msg));
    }

    function onAddressbookSubscriptionDeleted(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_DELETED, msg);

      pubsub.local.topic(NOTIFICATIONS.ADDRESSBOOK_SUBSCRIPTION_DELETED).publish(parseAddressbook(msg));
    }

    function onAddressbookSubscriptionUpdated(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_UPDATED, msg);

      pubsub.local.topic(NOTIFICATIONS.ADDRESSBOOK_SUBSCRIPTION_UPDATED).publish(parseAddressbook(msg));
    }

    function onAddressbookSubscriptionCreated(msg) {
      logger.debug('New event from SabreDAV', GLOBAL_PUBSUB_EVENTS.SABRE.ADDRESSBOOK_SUBSCRIPTION_CREATED, msg);

      pubsub.local.topic(NOTIFICATIONS.ADDRESSBOOK_SUBSCRIPTION_CREATED).publish(parseAddressbook(msg));
    }

    function shouldPublishElasticsearchMessage(message) {
      return !message.sourcePath && message.path && message.path !== '/';
    }
  }
};
