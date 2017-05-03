'use strict';

const q = require('q');

module.exports = dependencies => {
  const communities = dependencies('communities');
  const messageModule = dependencies('message');
  const messageHelpers = dependencies('helpers').message;

  return {
    postCommunityMessage,
    getWritableCommunities
  };

  /////

  function postCommunityMessage(req, res) {
    var fields = req.body.actionFields;

    if (!fields || !fields.message || !fields.community) {
      return res.status(400).json({ errors: [{ message: 'Missing or invalid "message" or "community" action fields' }]});
    }

    const targets = [{
            objectType: 'activitystream',
            id: fields.community
          }],
          message = messageHelpers.postToModelMessage({
            object: {
              description: fields.message,
              objectType: 'whatsup',
              attachments: []
            },
            targets: targets
          }, req.user);

    messageModule
      .getInstance(message.objectType, message)
      .save(function(err, saved) {
        if (err) {
          return res.status(500).json({ errors: [{ message: err.message }]});
        }

        messageHelpers.publishMessageEvents(saved, targets, req.user, 'post');

        res.status(200).json({ data: [{ id: saved._id }] });
      });
  }

  function getWritableCommunities(req, res) {
    const user = req.user;

    q.ninvoke(communities, 'getUserCommunities', user, { writable: true, domainid: user.preferredDomainId })
      .then(communities => communities.map(community => ({ label: community.title, value: community.activity_stream.uuid })))
      .then(
        communities => res.status(200).json({ data: communities }),
        err => res.status(500).json({ errors: [{ message: err.message }]})
      );
  }
};
