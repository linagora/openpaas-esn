'use strict';

const CONSTANTS = require('../lib/constants');
const NAMESPACE = CONSTANTS.WEBSOCKET.NAMESPACE;
const USER_STATE = CONSTANTS.NOTIFICATIONS.USER_STATE;
let initialized = false;
let chatNamespace;

module.exports = {
  init
};

function init(dependencies) {
  const logger = dependencies('logger');
  const io = dependencies('wsserver').io;
  const helper = dependencies('wsserver').ioHelper;
  const pubsub = dependencies('pubsub');
  const globalPubsub = pubsub.global;

  if (initialized) {
    return logger.warn('The userstatus notification service is already initialized');
  }

  chatNamespace = io.of(NAMESPACE);
  chatNamespace.on('connection', socket => {
    const userId = helper.getUserId(socket);

    logger.debug(`New connection on ${NAMESPACE} by user ${userId}`);
    initialized = true;
  });

  globalPubsub.topic(USER_STATE).subscribe(data => chatNamespace.emit(USER_STATE, data));
}
