'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var oauthModule = new AwesomeModule('linagora.esn.oauth.consumer', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib: function(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);
      var oauth = require('./backend/webserver/api/oauth')(dependencies);

      var lib = {
        api: {
          oauth: oauth
        },
        lib: libModule
      };
      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(this, dependencies);
      app.use('/', this.api.oauth);

      var webserverWrapper = dependencies('webserver-wrapper');
      webserverWrapper.addApp('oauth', app);

      return callback();
    },

    start: function(dependencies, callback) {
      this.lib.start(callback);
    }
  }
});

module.exports = oauthModule;
