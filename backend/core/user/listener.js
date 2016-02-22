'use strict';

var CONSTANTS = require('./constants');
var elasticsearchListener = require('../elasticsearch/listeners');
var userSearch = require('./search');

function register() {
  elasticsearchListener.addListener({
    events: {
      add: CONSTANTS.EVENTS.userCreated,
      update: CONSTANTS.EVENTS.userUpdated,
      remove: CONSTANTS.EVENTS.userDeleted
    },
    denormalize: userSearch.denormalize,
    type: CONSTANTS.ELASTICSEARCH.type,
    index: CONSTANTS.ELASTICSEARCH.index
  });
}
module.exports.register = register;
