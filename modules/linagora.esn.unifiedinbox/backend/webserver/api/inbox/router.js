'use strict';

var express = require('express');

module.exports = function(dependencies) {

  var sendEmail = require('./sendEmail')(dependencies),
      esnConfig = dependencies('esn-config'),
      authorizationMW = dependencies('authorizationMW');

  var router = express.Router();
  router.post('/api/inbox/sendemail', authorizationMW.requiresAPILogin, sendEmail.sendEmailToRecipients);
  router.get('/api/inbox/jmap-config', authorizationMW.requiresAPILogin, function(req, res) {
    esnConfig('jmap').get(function(err, config) {

      if (err) {
        res.status(500).send(err);
      } else if (!config) {
        res.status(404).send('the "jmap" config cannot be found');
      } else {
        delete config._id;
        res.send(config);
      }

    });
  });

  return router;
};
