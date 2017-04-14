'use strict';

const {EVENTS, NOTIFICATIONS} = require('../constants');
const eventHelper = require('../helpers/event');
const ICAL = require('ical.js');

module.exports = dependencies => {
  const pubsub = dependencies('pubsub');
  const logger = dependencies('logger');

  return {
    listen
  };

  function listen() {
    pubsub.global.topic(EVENTS.EVENT.CREATED).subscribe(added);
    pubsub.global.topic(EVENTS.EVENT.REQUEST).subscribe(added);
    pubsub.global.topic(EVENTS.EVENT.UPDATED).subscribe(updated);
    pubsub.global.topic(EVENTS.EVENT.REPLY).subscribe(updated);
    pubsub.global.topic(EVENTS.EVENT.DELETED).subscribe(deleted);
    pubsub.global.topic(EVENTS.EVENT.CANCEL).subscribe(deleted);

    function parse(msg) {
      const data = eventHelper.parseEventPath(msg.eventPath);

      try {
        data.ics = (new ICAL.Component(msg.event)).toString();
      } catch (error) {
        logger.error(`Problem stringifying component  ${error}`);
      }

      return data;
    }

    function added(msg) {
      pubsub.local.topic(NOTIFICATIONS.EVENT_ADDED).publish(parse(msg));
    }

    function updated(msg) {
      pubsub.local.topic(NOTIFICATIONS.EVENT_UPDATED).publish(parse(msg));
    }

    function deleted(msg) {
      pubsub.local.topic(NOTIFICATIONS.EVENT_DELETED).publish(parse(msg));
    }
  }
};
