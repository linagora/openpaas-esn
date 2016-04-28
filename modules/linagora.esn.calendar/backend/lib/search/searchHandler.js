'use strict';

var CONSTANTS = require('../constants');
var denormalize = require('./denormalize');

module.exports = function(dependencies) {

  var listeners = dependencies('elasticsearch').listeners;

  function getOptions() {
    return {
      events: {
        add: CONSTANTS.NOTIFICATIONS.EVENT_ADDED,
        update: CONSTANTS.NOTIFICATIONS.EVENT_UPDATED,
        remove: CONSTANTS.NOTIFICATIONS.EVENT_DELETED
      },
      denormalize: denormalize.denormalize,
      getId: denormalize.getId,
      type: CONSTANTS.SEARCH.TYPE_NAME,
      index: CONSTANTS.SEARCH.INDEX_NAME
    };
  }

  function register() {
    return listeners.addListener(getOptions());
  }

  return {
    register: register,
    getOptions: getOptions
  };
};
