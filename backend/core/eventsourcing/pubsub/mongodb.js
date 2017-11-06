'use strict';

const coreEvent = require('../events');
const logger = require('../../logger');

module.exports = {
  handle
};

function handle(event) {
  coreEvent.create(event)
    .then(() => logger.debug(`Event ${event.name}:${event.uuid} has been stored`))
    .catch(err => logger.error(`Event ${event.name}:${event.uuid} can not be stored`, err));
}
