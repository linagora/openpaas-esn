'use strict';

var q = require('q');

var messageModule = require('../../core/message');
var likeMessageModule = messageModule.like;

function denormalize(message, options) {

  message.likes = {
    me: {
      liked: false
    },
    users: [],
    total_count: 0
  };

  return q.allSettled([
    likeMessageModule.getNbOfLikes(message),
    likeMessageModule.isMessageLikedByUser(message, options.user)
  ]).spread(function(likes, liked) {
    if (likes.state === 'fulfilled') {
      message.likes.total_count = likes.value || 0;
    }

    if (liked.state === 'fulfilled') {
      message.likes.me.liked = liked.value;
    }

    return message;
  });
}
module.exports.denormalize = denormalize;
