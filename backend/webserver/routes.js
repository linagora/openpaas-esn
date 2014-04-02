'use strict';

var authorize = require('./middleware/authorization');
var cookielifetime = require('./middleware/cookie-lifetime');
var link = require('./middleware/link');

exports = module.exports = function(application) {

  var companies = require('./controllers/companies');
  var domains = require('./controllers/domains');
  application.get('/api/companies', companies.search);
  application.get('/api/domains/:uuid/members', domains.getMembers);
  application.post('/api/domains', domains.createDomain);
  application.post('/api/domains/:uuid/invitations', authorize.requiresAPILogin, domains.load, authorize.requiresDomainManager, domains.sendInvitations);

  var users = require('./controllers/users');
  application.get('/logout', users.logout);
  application.get('/api/profile/:uuid', authorize.requiresAPILogin, link.trackProfileView, users.profile);

  var views = require('./controllers/views');
  application.get('/views/*', views.views);

  require('./middleware/setup-routes')(application);

  var home = require('./controllers/home');
  application.get('/', home.index);

  application.get('/api/monitoring', require('./controllers/monitoring'));

  var documentstore = require('./controllers/document-store');
  application.put('/api/document-store/connection', documentstore.store);
  application.put('/api/document-store/connection/:hostname/:port/:dbname', documentstore.test);

  var invitation = require('./controllers/invitation');
  application.post('/api/invitation', invitation.create);
  application.put('/api/invitation/:uuid', invitation.load, invitation.finalize);
  application.get('/api/invitation/:uuid', invitation.load, invitation.get);
  application.get('/invitation/signup', invitation.signup);
  application.get('/invitation/:uuid', invitation.load, invitation.confirm);

  var locale = require('./controllers/locale');
  application.get('/api/locales', locale.getAll);
  application.get('/api/locales/current', locale.get);
  application.get('/api/locales/:locale', locale.set);

  var loginController = require('./controllers/login');
  var loginRules = require('./middleware/login-rules');
  var recaptcha = require('./middleware/verify-recaptcha');
  application.get('/login', loginController.index);
  application.post('/api/login', loginRules.checkLoginCount, cookielifetime.set, recaptcha.verify, loginController.login);
  application.get('/api/login/user', authorize.requiresAPILogin, loginController.user);
};

