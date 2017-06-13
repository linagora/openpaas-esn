'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var jobQueueModule = new AwesomeModule('linagora.esn.jobqueue', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib: function(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);

      return callback(null, {
        lib: libModule
      });
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(this.lib, dependencies);
      var modules = ['app.js', 'directives.js'];
      var webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularModules('jobqueue', modules, 'linagora.esn.jobqueue', ['esn']);
      webserverWrapper.addApp('jobqueue', app);

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

jobQueueModule.frontend = {
  angularModules: [
    [
      'jobqueue', modules, 'linagora.esn.jobqueue', ['esn']
    ]
  ]
};

module.exports = jobQueueModule;
