'use strict';

function projectWebserverRoutes(app, projectLib, dependencies) {
  var controllers = require('./controllers')(projectLib, dependencies);
  app.get('/api/projects', controllers.getAll);
}

module.exports = projectWebserverRoutes;
