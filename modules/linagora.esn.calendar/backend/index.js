'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var AwesomeCalendarModule = new AwesomeModule('linagora.esn.calendar', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.db', 'db'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.config', 'config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.user', 'user'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.collaboration', 'collaboration'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.activitystreams', 'activitystreams'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.helpers', 'helpers'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.message', 'message'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.collaboration', 'collaborationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'awm.content-sender', 'content-sender'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver')
  ],

  states: {
    lib: function(dependencies, callback) {
      var calendar = require('./webserver/api/calendar')(dependencies);

      var lib = {
        api: {
          calendar: calendar
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
      app.use('/', this.api.calendar);

      var webserverWrapper = dependencies('webserver-wrapper');
      webserverWrapper.injectAngularModules('calendar', ['app.js', 'constants.js', 'controllers.js', 'directives.js', 'filter.js', 'services.js', 'ical.js'], ['esn.calendar', 'esn.ical'], ['esn']);
      var lessFile = path.resolve(__dirname, '../frontend/css/styles.less');
      webserverWrapper.injectLess('calendar', [lessFile], 'esn');
      webserverWrapper.addApp('calendar', app);

      return callback();
    },

    start: function(dependencies, callback) {
      require('./ws/calendar').init(dependencies);
      callback();
    }
  }
});

/**
 * The main AwesomeModule describing the application.
 * @type {AwesomeModule}
 */
module.exports = AwesomeCalendarModule;
