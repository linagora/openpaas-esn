'use strict';

var logger = require(__dirname + '/../../core').logger,
    mongoose = require('mongoose'),
    Whatsup = mongoose.model('Whatsup');

module.exports.save = function(message, callback) {
  var whatsup = new Whatsup(message);
  whatsup.save(function(err, response) {
    if (!err) {
      logger.info('Added new message in database:', { _id: response._id.toString() });
    } else {
      logger.warn('Error while trying to add a new message in database:', err.message);
    }
    callback(err, response);
  });
};
