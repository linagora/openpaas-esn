'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var AwesomeCalendarModule = new AwesomeModule('linagora.esn.calendar', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.db', 'db'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.calendar.i18n', 'i18n')
  ],

  states: {
    lib: function(dependencies, callback) {
      var thing = require('./webserver/api/thing')(dependencies);
      var lib = {
        api: {
          thing: thing
        }
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./webserver/application')(dependencies);
      app.use('/', this.thing);

      var webserverWrapper = dependencies('webserver-wrapper');
      // inject js, css and angular modules here. The format is :
      // webserverWrapper.injectAngularModules('calendar', ['app.js', 'controllers.js', 'directives.js', 'services.js'], 'esn.<%= appName %>', ['esn']);
      // webserverWrapper.injectJS(['script.js'], 'esn');
      // webserverWrapper.injectCSS('calendar', ['styles.css'], 'esn');
      webserverWrapper.addApp('calendar', this.app);
      return callback();
    },

    start: function(dependencies, callback) {
      callback();
    }
  }
});

/**
 * The main AwesomeModule describing the application.
 * @type {AwesomeModule}
 */
module.exports = AwesomeCalendarModule;
