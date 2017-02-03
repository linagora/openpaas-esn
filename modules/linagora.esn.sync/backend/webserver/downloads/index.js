'use strict';

module.exports = dependencies => {
  const auth = dependencies('authorizationMW'),
        controller = require('./controller')(dependencies),
        router = require('express').Router();

  router.get('/downloads/thunderbird/op-tb-autoconf.xpi', auth.requiresAPILogin, controller.downloadTBExtension);

  return router;
};
