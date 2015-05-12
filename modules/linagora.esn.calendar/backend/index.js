'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var AwesomeCalendarModule = new AwesomeModule('linagora.esn.calendar', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.db', 'db'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.collaboration', 'collaboration'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.activitystreams', 'activitystreams'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.helpers', 'helpers'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.message', 'message'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.collaboration', 'collaborationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],

  states: {
    lib: function(dependencies, callback) {
      var calendar = require('./webserver/api/calendar')(dependencies);
      var caldavserver = require('./webserver/api/caldavserver')(dependencies);

      var lib = {
        api: {
          calendar: calendar,
          caldavserver: caldavserver
        }
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      // Register the new message type event
      var message = dependencies('message');
      message.registerMessageType('event', 'EventMessage');

      // Register the webapp
      var app = require('./webserver/application')(dependencies);
      app.use('/', this.api.caldavserver);
      app.use('/', this.api.calendar);

      var webserverWrapper = dependencies('webserver-wrapper');
      webserverWrapper.injectAngularModules('calendar', ['app.js', 'controllers.js', 'directives.js', 'services.js', 'ical.js'], ['esn.calendar', 'esn.ical'], ['esn']);
      webserverWrapper.injectCSS('calendar', ['style.css'], 'esn');
      webserverWrapper.addApp('calendar', app);

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
