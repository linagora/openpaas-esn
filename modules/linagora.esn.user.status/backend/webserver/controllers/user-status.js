'use strict';

module.exports = function(dependencies, lib) {

  return {
    getUserStatus
  };

  function getUserStatus(req, res) {
    res.status(200).json({me: 'online'});
  }
};
