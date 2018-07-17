const { ELASTICSEARCH_EVENTS, SEARCH } = require('../constants');
const denormalize = require('./denormalize');

module.exports = dependencies => {
  const listeners = dependencies('elasticsearch').listeners;

  function getOptions() {
    return {
      events: {
        add: ELASTICSEARCH_EVENTS.CONTACT_ADDED,
        update: ELASTICSEARCH_EVENTS.CONTACT_UPDATED,
        remove: ELASTICSEARCH_EVENTS.CONTACT_DELETED
      },
      denormalize: denormalize.denormalize,
      getId: denormalize.getId,
      type: SEARCH.TYPE_NAME,
      index: SEARCH.INDEX_NAME
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
