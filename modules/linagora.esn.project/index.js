'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var projectModule = new AwesomeModule('linagora.esn.project', {
  dependencies: [
  new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
  new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.collaboration', 'collaboration'),
  new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.community', 'community'),
  new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.image', 'image'),
  new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
  new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
  new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.domain', 'domainMW'),
  new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.activitystream', 'activitystreamMW')
  ],
  states: {
    lib: function(dependencies, callback) {
      var lib = require('./lib')(dependencies);
      var collaborationModule = dependencies('collaboration');
      collaborationModule.registerCollaborationLib('project', lib);
      return callback(null, lib);
    },
    deploy: function(dependencies, callback) {
      var webserverWrapper = dependencies('webserver-wrapper');
      var app = require('./backend/webserver/application')(this, dependencies);
      webserverWrapper.injectAngularModules('project', ['app.js', 'controllers.js', 'directives.js', 'services.js'], 'esn.project', ['esn']);
      var lessFile = path.resolve(__dirname, './frontend/css/style.less');
      webserverWrapper.injectLess('project', [lessFile], 'esn');
      webserverWrapper.addApp('project', app);
      return callback();
    }
  }
});

module.exports = projectModule;
