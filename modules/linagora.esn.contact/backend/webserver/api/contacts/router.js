'use strict';

const express = require('express');

module.exports = dependencies => {
  const authorizationMW = dependencies('authorizationMW'),
        tokenMiddleware = dependencies('tokenMW'),
        davMiddleware = dependencies('davserver').davMiddleware,
        controller = require('./controller')(dependencies),
        router = express.Router();

  router.get('/:addressBookId/:addressbookName/:contactId/avatar',
    authorizationMW.requiresAPILogin,
    davMiddleware.getDavEndpoint,
    tokenMiddleware.generateNewToken(),
    controller.getAvatar);

  router.get('/search', authorizationMW.requiresAPILogin, controller.searchContacts);

  return router;
};
