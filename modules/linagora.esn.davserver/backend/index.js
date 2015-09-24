'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var AwesomeDavModule = new AwesomeModule('linagora.esn.davserver', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],

  states: {
    lib: function(dependencies, callback) {
      var davserver = require('./webserver/api/davserver')(dependencies);
      var davMiddleware = require('./webserver/api/middleware')(dependencies);
      var utils = require('./lib/utils')(dependencies);

      var lib = {
        api: {
          davserver: davserver
        },
        davMiddleware: davMiddleware,
        utils: utils
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var webserverWrapper = dependencies('webserver-wrapper');

      var app = require('./webserver/application')(dependencies);
      app.use('/', this.api.davserver);
      webserverWrapper.addApp('davserver', app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  },

  abilities: ['davserver']
});

/**
 * The main AwesomeModule describing the application.
 * @type {AwesomeModule}
 */
module.exports = AwesomeDavModule;
