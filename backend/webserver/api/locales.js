'use strict';

var locale = require('../controllers/locale');

module.exports = function(router) {
  router.get('/locales', locale.getAll);
  router.get('/locales/current', locale.get);
  router.get('/locales/:locale', locale.set);
};
