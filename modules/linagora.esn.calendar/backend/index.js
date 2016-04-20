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
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.auth', 'auth'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.collaboration', 'collaborationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.token', 'tokenMW'),
    new Dependency(Dependency.TYPE_NAME, 'awm.content-sender', 'content-sender'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.wsserver', 'wsserver'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.davserver', 'davserver'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.cron', 'cron')
  ],

  states: {
    lib: function(dependencies, callback) {
      var calendar = require('./webserver/api/calendar')(dependencies);
      var alarm = require('./lib/alarm')(dependencies);

      var lib = {
        alarm: alarm,
        api: {
          calendar: calendar
        }
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      // Init alarm local pubsub listener
      this.alarm.init();

      // Register the new message type event
      var message = dependencies('message');
      message.registerMessageType('event', 'EventMessage');

      // Register the webapp
      var app = require('./webserver/application')(dependencies);
      app.use('/', this.api.calendar);

      var webserverWrapper = dependencies('webserver-wrapper');
      var jsFiles = [
        'app.js',
        'constants.js',
        'ical.js',
        'fcmoment.js',
        'request.js',
        'calendarshell.js',
        'calendarcollectionshell.js',
        'components/event-date-edition.js',
        'components/event-date-consultation.js',
        'components/event-alarm-edition.js',
        'components/event-alarm-consultation.js',
        'components/mail-to-attendees.js',
        'components/attendee-list-item.js',
        'components/attendees-list.js',
        'components/attendees-autocomplete-input.js',
        'components/event-recurrence-edition.js',
        'components/calendars-list.js',
        'components/calendar-color-picker.js',
        'components/event-create-button.js',
        'components/mini-calendar/directive.js',
        'components/mini-calendar/controller.js',
        'components/mini-calendar/service.js',
        'calendar-configuration/calendar-edit.js',
        'calendar-configuration/calendars-edit.js',
        'calendar/apis.js',
        'calendar/controllers.js',
        'calendar/directives.js',
        'calendar/services/calendar-attendee-service.js',
        'calendar/services/calendar-current-view.js',
        'calendar/services/calendar-event-emitter.js',
        'calendar/services/calendar-event-source.js',
        'calendar/services/calendar-service.js',
        'calendar/services/calendar-utils.js',
        'calendar/services/event-utils.js',
        'calendar/services/master-event-cache.js',
        'calendar/services/cached-event-source.js',
        'event-form/controllers.js',
        'event-form/services.js',
        'event-form/filters.js',
        'event-message/directives.js',
        'event-consult-form/directives.js',
        'event-quick-form/directives.js',
        'event-full-form/directives.js'
      ];
      webserverWrapper.injectAngularModules('calendar', jsFiles, ['esn.calendar', 'esn.ical'], ['esn']);
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
