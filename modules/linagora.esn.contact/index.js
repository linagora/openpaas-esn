'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var contactModule = new AwesomeModule('linagora.esn.contact', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib: function(dependencies, callback) {
      var davserver = require('./backend/webserver/api/davserver')(dependencies);

      var lib = {
        api: {
          davserver: davserver
        }
      };
      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      // Register the webapp
      var app = require('./backend/webserver/application')(this, dependencies);
      app.use('/', this.api.davserver);

      var webserverWrapper = dependencies('webserver-wrapper');
      webserverWrapper.injectAngularModules('contacts', ['contact.js', 'controllers.js', 'directives.js', 'services.js'], 'linagora.esn.contact', ['esn']);
      webserverWrapper.injectCSS('contacts', ['styles.css'], 'esn');
      webserverWrapper.addApp('contacts', app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = contactModule;
