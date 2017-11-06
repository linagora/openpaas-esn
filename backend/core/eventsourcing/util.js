'use strict';

const uuidV4 = require('uuid/v4');
const { Event } = require('../models');

module.exports = {
  refineEvent
};

function refineEvent(name, data) {
  let event;

  if (data instanceof Event) {
    event = data;
    event.name = name;
  } else {
    // avoid concrete value error on ES parse
    data = (typeof data === 'object') ? data : { value: data };
    event = new Event(data.uuid, name, data.objectType, data.id, data, {}, data.timestamp);
  }

  event.uuid = event.uuid || uuidV4();

  return event;
}
