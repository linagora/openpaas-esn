'use strict';

module.exports = dependencies => {
  const  chatModule = dependencies('chat');

  return {
    newChatUserMention
  };

  /////

  function newChatUserMention(req, res) {
    let query = {
      limit: req.limit
    };

    chatModule.lib.message.getMentions(req.user._id, query)
      .then(mentions => res.status(200).json(_resultsToIFTTTData(mentions))
      .catch(err => sendHTTPError('Error while getting user mentions', err, res)));
  }

  function _resultsToIFTTTData(mentions) {
    console.log(mentions);
    //CreatedAt
    //CreatorName
    //Message

  }
};
