'use strict';

module.exports = dependencies => {
  const  chatModule = dependencies('chat');

  return {
    newChatUserMention
  };

  /////

  function newChatUserMention(req, res) {
    chatModule.lib.message.getMentions(req.user._id, req.query)
      .then(mentions => res.status(200).json(mentions))
      .catch(err => sendHTTPError('Error while getting user mentions', err, res));
  }
};
