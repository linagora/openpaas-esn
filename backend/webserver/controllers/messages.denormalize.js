const Q = require('q');
const messageModule = require('../../core/message');
const likeMessageModule = messageModule.like;

module.exports = {
  denormalize
};

function denormalize(message, options) {
  message.likes = {
    me: {
      liked: false
    },
    users: [],
    total_count: 0
  };

  return Q.allSettled([
    likeMessageModule.getNbOfLikes(message),
    likeMessageModule.isMessageLikedByUser(message, options.user)
  ])
  .spread((likes, liked) => {
    if (likes.state === 'fulfilled') {
      message.likes.total_count = likes.value || 0;
    }

    if (liked.state === 'fulfilled') {
      message.likes.me.liked = liked.value;
    }

    return message;
  })
  .then(message => denormalizeResponses(message, options))
  .then(() => message);
}

function denormalizeResponses(message, options) {
  return Q.all((message.responses || []).map(response => denormalize(response, options)));
}
