'use strict';

module.exports = () => {
  return {
    postCommunityMessage
  };

  /////

  function postCommunityMessage(req, res) {
    res.status(201).end();
  }
};
