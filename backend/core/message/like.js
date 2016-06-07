'use strict';

var q = require('q');
var pubsub = require('../pubsub');
var logger = require('../logger');
var like = require('../like');
var CONSTANTS = require('./constants');

function listen() {
  pubsub.local.topic('resource:link:like:esn.message').subscribe(function(data) {
    logger.info('Someone liked a message...', data);
  });
}
module.exports.listen = listen;

function getNbOfLikes(message) {
  return like.getNbOfLikes({
    objectType: CONSTANTS.TYPE,
    id: String(message._id)
  });
}
module.exports.getNbOfLikes = getNbOfLikes;

function isMessageLikedByUser(message, user) {
  return like.isLikedBy({
    objectType: 'user',
    id: String(user._id)
  },
  {
    objectType: CONSTANTS.TYPE,
    id: String(message._id)
  });
}
module.exports.isMessageLikedByUser = isMessageLikedByUser;
