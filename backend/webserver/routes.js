'use strict';

var auth = require('./middleware/authorization');
var passport = require('passport');

exports = module.exports = function(application) {

  var users = require('./controllers/users');
  application.get('/login', users.login);
  application.post('/login', passport.authenticate('local', {failureRedirect: '/login', failureFlash: 'Invalid login or password.'}), users.logmein);
  application.get('/logout', users.logout);
  application.get('/account', auth.requiresLogin, users.account);

  var views = require('./controllers/views');
  application.get('/views/*', views.views);

  require('./middleware/setup-routes')(application);

  var home = require('./controllers/home');
  application.get('/', home.index);

  application.get('/api/monitoring', require('./controllers/monitoring'));

  var documentstore = require('./controllers/document-store');
  application.put('/api/document-store/connection', documentstore.store);
  application.put('/api/document-store/connection/:hostname/:port/:dbname', documentstore.test);
};

