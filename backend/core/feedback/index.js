'use strict';

var logger = require(__dirname + '/../../core').logger,
  mongoose = require('mongoose'),
  Feedback = mongoose.model('Feedback');

function save(feedback, callback) {
  var feedbackAsModel = new Feedback(feedback);
  feedbackAsModel.save(function(err, response) {
    if (err) {
      logger.warn('Error while trying to add a new feedback in database:', err.message);
      return callback(err);
    }
    logger.info('Added new feedback in database:', { _id: response._id.toString() });
    return callback(null, response);
  });
}

module.exports.save = save;
