'use strict';

function projectWebserverRoutes(app, projectLib, dependencies) {
  var controllers = require('./controllers')(projectLib, dependencies);
  var authorizationMW = dependencies('authorizationMW');
  var domainMW = dependencies('domainMW');

  app.get('/api/projects', authorizationMW.requiresAPILogin, domainMW.loadFromDomainIdParameter, authorizationMW.requiresDomainMember, controllers.getAll);
}

module.exports = projectWebserverRoutes;
