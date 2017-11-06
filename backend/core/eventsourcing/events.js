'use strict';

const Event = require('mongoose').model('Event');

module.exports = {
  create
};

function create(event) {
  return Event.create(event);
}
