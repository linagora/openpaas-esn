'use strict';

const {EVENTS, WEBSOCKET} = require('../lib/constants');
const _ = require('lodash');
let initialized = false;

module.exports = {
  init
};

function init(dependencies) {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub');
  const io = dependencies('wsserver').io;
  const eventHandler = require('./handlers/event')(dependencies);
  const calendarHandler = require('./handlers/calendar')(dependencies);

  if (initialized) {
    logger.warn('The calendar notification service is already initialized');

    return;
  }

  _.forOwn(EVENTS.EVENT, topic => {
    logger.debug('Subscribing to global topic', topic);
    pubsub.global.topic(topic).subscribe(msg => {
      logger.debug('Received a message on', topic);
      pubsub.local.topic(topic).publish(msg);
      eventHandler.notify(topic, msg);
    });
  });

  _.forOwn(EVENTS.CALENDAR, topic => {
    logger.debug('Subscribing to global topic', topic);
    pubsub.global.topic(topic).subscribe(msg => {
      logger.debug('Received a message on', topic, msg);
      calendarHandler.notify(topic, msg);
    });
  });

  io.of(WEBSOCKET.NAMESPACE)
    .on('connection', socket => {
      logger.info('New connection on', WEBSOCKET.NAMESPACE);

      socket.on('subscribe', uuid => {
        logger.info('Joining room', uuid);
        socket.join(uuid);
      });

      socket.on('unsubscribe', uuid => {
        logger.info('Leaving room', uuid);
        socket.leave(uuid);
      });
    });
  initialized = true;
}
