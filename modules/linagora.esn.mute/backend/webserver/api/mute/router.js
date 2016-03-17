'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var esnConfig = dependencies('esn-config'),
      authorizationMW = dependencies('authorizationMW');

  var router = express.Router();
  router.get('/api/mute/config', authorizationMW.requiresAPILogin, function(req, res) {
    esnConfig('mute').get(function(err, config) {

      if (err) {
        res.send(500, err);
      } else if (!config) {
        res.send(404, 'the "mute" config cannot be found');
      } else {
        delete config._id;
        res.send(config);
      }

    });
  });

  return router;
};
