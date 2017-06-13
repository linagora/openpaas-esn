'use strict';

var ping = require('../controllers/ping');

module.exports = function(router) {
  router.get('/ping', ping.ping);
};
