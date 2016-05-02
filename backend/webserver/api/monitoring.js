'use strict';

var monitoring = require('../controllers/monitoring');

module.exports = function(router) {
  router.get('/monitoring', monitoring);
};
