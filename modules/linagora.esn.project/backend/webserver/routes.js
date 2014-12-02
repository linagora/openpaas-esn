'use strict';


function projectWebserverRoutes(app, projectLib, dependencies) {

  function views(req, res, next) {
    var templateName = req.params[0].replace(/\.html$/, '');
    res.render(templateName);
  }

  app.get('/views/*', views);

  var controllers = require('./controllers')(projectLib, dependencies);
  var authorizationMW = dependencies('authorizationMW');
  var domainMW = dependencies('domainMW');
  var membershipController = require('./controllers/members')(projectLib, dependencies);
  var projectMW = require('./middleware/project')(projectLib, dependencies);
  var permissionsMW = require('./middleware/permissions')(projectLib, dependencies);

  app.get('/api/projects', authorizationMW.requiresAPILogin, domainMW.loadFromDomainIdParameter, authorizationMW.requiresDomainMember, controllers.getAll);
  app.get('/api/projects/:id', authorizationMW.requiresAPILogin, controllers.get);
  app.post('/api/projects', authorizationMW.requiresAPILogin, controllers.create);
  app.post('/api/projects/:id/members', authorizationMW.requiresAPILogin, projectMW.load, permissionsMW.userIsProjectCreator, membershipController.add);
}

module.exports = projectWebserverRoutes;
