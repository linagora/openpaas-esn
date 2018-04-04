const mongoose = require('mongoose');
const CommunityArchive = mongoose.model('CommunityArchive');
const localpubsub = require('../pubsub').local;
const { EVENTS } = require('./constants');

module.exports = {
  process
};

function process(community, user) {
  const archive = new CommunityArchive({ _id: community._id, creator: user, source: community });

  return archive.save()
    .then(() => community.remove())
    .then(() => {
      localpubsub.topic(EVENTS.communityArchived).publish({ community, user });
    });
}
