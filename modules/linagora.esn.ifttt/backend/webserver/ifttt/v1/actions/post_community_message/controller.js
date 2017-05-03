'use strict';

const q = require('q');

module.exports = dependencies => {
  const communities = dependencies('communities');

  return {
    postCommunityMessage,
    getWritableCommunities
  };

  /////

  function postCommunityMessage(req, res) {
    res.status(201).end();
  }

  function getWritableCommunities(req, res) {
    const user = req.user;

    q.ninvoke(communities, 'getUserCommunities', user, { writable: true, domainid: user.preferredDomainId })
      .then(communities => communities.map(community => ({ label: community.title, value: community.activity_stream.uuid })))
      .then(
        communities => res.status(200).json({ data: communities }),
        err => res.status(500).json({ error: { code: 500, message: 'Server error', details: err.message } })
      );
  }
};
