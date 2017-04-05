'use strict';

const {EVENTS, NOTIFICATIONS} = require('../constants');
const eventHelper = require('../helpers/sabre');
const ICAL = require('ical.js');

module.exports = dependencies => {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub');

  return {
    listen
  };

  function forwardEvent(msg) {
    const data = eventHelper.parseEventPath(msg.eventPath);
    const action = msg.websocketEvent;

    data.ics = (new ICAL.Component(msg.event)).toString();

    if (action === EVENTS.EVENT.CREATED || action === EVENTS.EVENT.REQUEST) {
      pubsub.local.topic(NOTIFICATIONS.EVENT_ADDED).publish(data);
    } else if (action === EVENTS.EVENT.UPDATED || action === EVENTS.EVENT.REPLY) {
      pubsub.local.topic(NOTIFICATIONS.EVENT_UPDATED).publish(data);
    } else if (action === EVENTS.EVENT.DELETED || action === EVENTS.EVENT.CANCEL) {
      pubsub.local.topic(NOTIFICATIONS.EVENT_DELETED).publish(data);
    } else {
      logger.warn('Unknow Event type received for Calendar Indexing', action);
    }
  }

  function listen() {
    pubsub.global.topic(EVENTS.TOPIC.EVENT).subscribe(forwardEvent);
  }
};
