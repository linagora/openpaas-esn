'use strict';

const Event = require('mongoose').model('Event');

module.exports = {
  create,
  listByCursor
};

function create(event) {
  return Event.create(event);
}

function listByCursor() {
  return Event.find().cursor();
}
