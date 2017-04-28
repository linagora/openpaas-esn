'use strict';

module.exports = dependencies => {
  const lib = require('../../../lib/ifttt')(dependencies);

  return {
    status,
    userInfo
  };

  /////

  function status(req, res) {
    const channelKey = req.get('IFTTT-Channel-Key');

    res.status(lib.constants.SERVICE_KEY === channelKey ? 200 : 401).end();
  }

  function userInfo(req, res) {
    const user = req.user;

    res.status(200).json({
      data: {
        id: user.id,
        name: user.firstname + ' ' + user.lastname
      }
    });
  }
};
