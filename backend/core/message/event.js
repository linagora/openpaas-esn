'use strict';

var logger = require(__dirname + '/../../core').logger,
  mongoose = require('mongoose'),
  EventMessage = mongoose.model('EventMessage'),
  pubsub = require('../pubsub').local;

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
