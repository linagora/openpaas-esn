'use strict';

const CONSTANTS = require('../constants');
const denormalize = require('./denormalize');

module.exports = dependencies => {
  const listeners = dependencies('elasticsearch').listeners;

  return {
    getOptions,
    register
  };

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
};
