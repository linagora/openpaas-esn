'use strict';

var CONSTANTS = require('./constants');
var elasticsearchListener = require('../elasticsearch/listeners');
var userSearch = require('./search');

function getOptions() {
  return {
    events: {
      add: CONSTANTS.EVENTS.userCreated,
      update: CONSTANTS.EVENTS.userUpdated,
      remove: CONSTANTS.EVENTS.userDeleted
    },
    denormalize: userSearch.denormalize,
    type: CONSTANTS.ELASTICSEARCH.type,
    index: CONSTANTS.ELASTICSEARCH.index
  };
}
module.exports.getOptions = getOptions;

function register() {
  elasticsearchListener.addListener(getOptions());
}
module.exports.register = register;
