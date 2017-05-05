'use strict';

const uuid = require('node-uuid');

module.exports = dependencies => {
  const chatModule = dependencies('chat');
  const localPubsub = dependencies('pubsub').local;

  return {
    postChatMessage,
    getWritableConversations
  };

  function postChatMessage(req, res) {
    const fields = req.body.actionFields;

    if (!fields || !fields.message || !fields.conversation) {
      return res.status(400).json({ errors: [{ message: 'Missing or invalid "message" or "conversation" action fields' }]});
    }

    const message = {
      channel: fields.conversation,
      date: Date.now(),
      creator: req.user._id,
      type: 'text',
      text: fields.message
    };

    localPubsub.topic('chat:message:received').publish({message});
    res.status(200).json({ data: [{ id: uuid.v4() }] });
  }

  function getWritableConversations(req, res) {
    const query = {
      mode: 'channel',
      ignoreMemberFilterForChannel: false,
      members: [{member: {objectType: 'user', id: String(req.user._id)}}]
    };

    chatModule.lib.conversation.find(query, (err, conversations) => {
      if (err) {
        return res.status(500).json({ errors: [{ message: err.message }]});
      }

      res.status(200).json(
        {data: conversations.map(conversation => ({label: conversation.name, value: conversation._id}))
      });
    });
  }
};
