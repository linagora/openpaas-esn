'use strict';

module.exports = function(dependencies, lib, router) {

  const authorizationMW = dependencies('authorizationMW');
  const controller = require('../controllers/user-status')(dependencies, lib);

  router.get('/users/:id',
    authorizationMW.requiresAPILogin,
    controller.getUserStatus);

  router.put('/user/status',
    authorizationMW.requiresAPILogin,
    controller.setCurrentUserStatus);

};
