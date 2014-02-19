'use strict';

var authorize = require('./middleware/authorization');
var authenticate = require('./middleware/authentication');

exports = module.exports = function(application) {

  var users = require('./controllers/users');
  application.get('/login', users.login);
  application.post('/login', authenticate.isAuthenticated, users.logmein);
  application.get('/logout', users.logout);
  application.get('/account', authorize.requiresLogin, users.account);

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
  application.put('/api/invitation', invitation.create);
  application.put('/api/invitation/:uuid', invitation.load, invitation.finalize);
  application.get('/api/invitation/:uuid', invitation.get);
  application.get('/invitation/:uuid', invitation.load, invitation.confirm);
};

