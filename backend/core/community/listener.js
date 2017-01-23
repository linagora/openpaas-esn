'use strict';

const CONSTANTS = require('./constants');
const elasticsearchListener = require('../elasticsearch/listeners');
const denormalize = require('./denormalize');

module.exports = {
  getOptions,
  register
};

function getOptions() {
  return {
    events: {
      add: CONSTANTS.EVENTS.communityCreated,
      update: CONSTANTS.EVENTS.communityUpdated,
      remove: CONSTANTS.EVENTS.communityDeleted
    },
    denormalize: denormalize.denormalize,
    getId: denormalize.getId,
    type: CONSTANTS.ELASTICSEARCH.type,
    index: CONSTANTS.ELASTICSEARCH.index
  };
}

function register() {
  elasticsearchListener.addListener(getOptions());
}
