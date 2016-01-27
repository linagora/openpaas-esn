'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var jobQueueModule = new AwesomeModule('linagora.esn.jobqueue', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper')
  ],
  states: {
    lib: function(dependencies, callback) {
      var libModule = require('./backend/lib')(dependencies);
      return callback(null, {
        lib: libModule
      });
    },

    deploy: function(dependencies, callback) {
      var webserverWrapper = dependencies('webserver-wrapper');
      if (process.env.NODE_ENV === 'dev') {
        webserverWrapper.addApp('jobqueueUI', this.lib.kue.app);
      }

      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

module.exports = jobQueueModule;
