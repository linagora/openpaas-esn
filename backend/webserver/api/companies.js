'use strict';

var companies = require('../controllers/companies');

module.exports = function(router) {
  router.get('/companies', companies.search);
};
