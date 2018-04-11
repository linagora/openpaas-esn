const mongoose = require('mongoose');
const MessageArchive = mongoose.model('MessageArchive');
const localpubsub = require('../pubsub').local;
const { EVENTS } = require('./constants');

module.exports = {
  process
};

function process(message, user) {
  const archive = new MessageArchive({ _id: message._id, creator: user, source: message });

  return archive.save()
    .then(() => message.remove())
    .then(() => {
      localpubsub.topic(EVENTS.MESSAGE_ARCHIVED).publish({ message, user });
    });
}
