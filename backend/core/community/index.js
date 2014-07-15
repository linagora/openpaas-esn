'use strict';

var mongoose = require('mongoose');
var Community = mongoose.model('Community');
var logger = require('../logger');

module.exports.save = function(community, callback) {
  if (!community) {
    return callback(new Error('Can not save null community'));
  }

  var com = new Community(community);
  com.save(function(err, response) {
    if (!err) {
      logger.info('Added new community:', { _id: response._id });
    } else {
      logger.info('Error while trying to add a new community:', err.message);
    }
    return callback(err, response);
  });
};

module.exports.load = function(community, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }

  var id = community._id || community;
  return Community.findOne({_id: id}, callback);
};

module.exports.query = function(query, callback) {
  query = query || {};
  return Community.find(query, callback);
};

module.exports.delete = function(community, callback) {
  if (!community) {
    return callback(new Error('Community is required'));
  }
  return callback(new Error('Not implemented'));
};
