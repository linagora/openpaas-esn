'use strict';

module.exports = function(dependencies) {

  var twitterLib = require('../../../lib/twitter')(dependencies);

  function importTwitterFollowing(req, res) {
    var options = {
      esnToken: req.token && req.token.token ? req.token.token : '',
      user: req.user
    };
    twitterLib.importer.importContact(options)
      .then(function() {
        return res.status(202).json();
      }, function(err) {
        return res.status(500).json(err);
      });
  }

  return {
    importTwitterFollowing: importTwitterFollowing
  };

};
