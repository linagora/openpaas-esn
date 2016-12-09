'use strict';

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/user-status')(dependencies, lib);

  router.get('/user/:id',
    authorizationMW.requiresAPILogin,
    controller.getUserStatus);
};
