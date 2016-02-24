'use strict';

var CONSTANTS = require('./constants');
var elasticsearchListener = require('../elasticsearch/listeners');
var communitiesSearch = require('./search');

function getOptions() {
  return {
    events: {
      add: CONSTANTS.EVENTS.communityCreated,
      update: CONSTANTS.EVENTS.communityUpdated,
      remove: CONSTANTS.EVENTS.communityDeleted
    },
    denormalize: communitiesSearch.denormalize,
    type: CONSTANTS.ELASTICSEARCH.type,
    index: CONSTANTS.ELASTICSEARCH.index
  };
}
module.exports.getOptions = getOptions;

function register() {
  elasticsearchListener.addListener(getOptions());
}
module.exports.register = register;
