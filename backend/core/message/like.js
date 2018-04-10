const pubsub = require('../pubsub');
const logger = require('../logger');
const like = require('../like');
const CONSTANTS = require('./constants');

module.exports = {
  getNbOfLikes,
  isMessageLikedByUser,
  listen
};

function listen() {
  pubsub.local.topic('resource:link:like:esn.message').subscribe(data => {
    logger.info('Someone liked a message...', data);
  });
}

function getNbOfLikes(message) {
  return like.getNbOfLikes({
    objectType: CONSTANTS.TYPE,
    id: String(message._id)
  });
}

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
