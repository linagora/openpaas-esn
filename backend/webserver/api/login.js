'use strict';

var loginController = require('../controllers/login');
var loginRules = require('../middleware/login-rules');
var recaptcha = require('../middleware/verify-recaptcha');
var cookielifetime = require('../middleware/cookie-lifetime');

module.exports = function(router) {
  router.post('/login', loginRules.checkLoginCount, cookielifetime.set, recaptcha.verify, loginController.login);
};
