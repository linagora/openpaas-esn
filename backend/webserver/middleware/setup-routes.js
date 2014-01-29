'use strict';

var core = require('../../core');

function setupRoute(app) {
  app.get('/', function(req, res, next) {
    if (core.configured()) {
      return next();
    }
    res.render('setup/index');
  });

  function failIfConfigured(req, res, next) {
    if (!core.configured()) {
      return next();
    }
    return res.json(400, { error: { status: 400, message: 'Bad Request', details: 'the database connection is already configured'}});
  }

  app.put('/api/document-store/connection', failIfConfigured);
  app.get('/api/document-store/connection/:hostname/:port/:dbname', failIfConfigured);
}

module.exports = setupRoute;
