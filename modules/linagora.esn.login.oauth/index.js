'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var MODULE_NAME = 'linagora.esn.login.oauth';
var APPLICATION_NAME = 'login';

var oauthLoginModule = new AwesomeModule(MODULE_NAME, {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.config', 'config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.helpers', 'helpers'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib: function(dependencies, callback) {
      var lib = require('./backend/lib')(dependencies);
      var api = require('./backend/webserver/api')(dependencies);
      return callback(null, {
        api: api,
        lib: lib
      });
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(this, dependencies);
      app.use('/oauth', this.api);

      var webserverWrapper = dependencies('webserver-wrapper');
      webserverWrapper.injectAngularModules(APPLICATION_NAME, ['app.js'], MODULE_NAME, ['esn']);
      webserverWrapper.addApp(APPLICATION_NAME, app);

      return callback();
    },

    start: function(dependencies, callback) {
      this.lib.start(callback);
    }
  }
});

module.exports = oauthLoginModule;
