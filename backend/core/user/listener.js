'use strict';

const CONSTANTS = require('./constants');
const elasticsearchListener = require('../elasticsearch/listeners');
const denormalize = require('./denormalize');

function getOptions() {
  return {
    events: {
      add: CONSTANTS.EVENTS.userCreated,
      update: CONSTANTS.EVENTS.userUpdated,
      remove: CONSTANTS.EVENTS.userDeleted
    },
    denormalize: denormalize.denormalizeForSearchIndexing,
    getId: denormalize.getId,
    type: CONSTANTS.ELASTICSEARCH.type,
    index: CONSTANTS.ELASTICSEARCH.index
  };
}

function register() {
  elasticsearchListener.addListener(getOptions());
}

module.exports = {
  getOptions,
  register
};
