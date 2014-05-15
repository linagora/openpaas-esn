'use strict';

var logger = require(__dirname + '/../../core').logger,
    mongoose = require('mongoose'),
    Whatsup = mongoose.model('Whatsup'),
    pubsub = require('../pubsub').local;

module.exports.save = function(message, callback) {
  var whatsup = new Whatsup(message),
      topic = pubsub.topic('message:stored');
  whatsup.save(function(err, response) {
    if (!err) {
      topic.publish(response);
      logger.info('Added new message in database:', { _id: response._id.toString() });
    } else {
      logger.warn('Error while trying to add a new message in database:', err.message);
    }
    callback(err, response);
  });
};

module.exports.findByIds = function(ids, callback) {
  var query = {
    _id: { $in: ids}
  };
  Whatsup.find(query).populate('author', null, 'User').exec(callback);
};

module.exports.get = function(uuid, callback) {
  Whatsup.findById(uuid).populate('author', null, 'User').exec(callback);
};
