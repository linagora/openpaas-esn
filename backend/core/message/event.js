'use strict';

var logger = require(__dirname + '/../../core').logger,
  mongoose = require('mongoose'),
  EventMessage = mongoose.model('EventMessage'),
  pubsub = require('../pubsub').local;

/**
 * Saves a new event message to the database, also publishing a message:stored
 * pubsub notification.
 *
 * @param {object} message          The message to be saved in the database.
 * @param {function} callback       The callback function, called with the result.
 */
module.exports.save = function(message, callback) {
  var eventMessage = new EventMessage(message),
    topic = pubsub.topic('message:stored');
  eventMessage.save(function(err, response) {
    if (!err) {
      topic.publish(response);
      logger.info('Added new event message in database:', { _id: response._id.toString() });
    } else {
      logger.warn('Error while trying to add a new event message in database:', err.message);
    }
    callback(err, response);
  });
};

/**
 * Find an EventMessage by its calendar eventId. This will only find calendar
 * event messages.
 *
 * @param {String} eventId          The event id to search for.
 * @param {function} callback       The callback function, called with the result.
 */
module.exports.findByEventId = function(eventId, callback) {
  var query = { objectType: 'event', eventId: eventId };
  return EventMessage.findOne(query).exec(callback);
};
