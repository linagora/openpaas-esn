'use strict';

var avatars = require('../controllers/avatars');

module.exports = function(router) {
  router.get('/avatars', avatars.get);
};
