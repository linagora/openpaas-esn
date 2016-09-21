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
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.elasticsearch', 'elasticsearch'),
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
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.email', 'email'),
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

        'core/application-menu-calendar.directive.js',
        'core/auto-size-and-update.directive.js',
        'core/calendar-date-indicator.directive.js',
        'core/calendar-view-translation.directive.js',
        'core/date-to-moment.directive.js',
        'core/event-form.controller.js',
        'core/friendlify-end-date.directive.js',
        'core/partstat.filter.js',
        'core/toggle-calendar-today.directive.js',
        'core/toggle-calendar-view.directive.js',
        'core/toggle-mini-calendar.directive.js',

        'services/events-provider/events-provider.js',
        'services/open-event-form/open-event-form.js',
        'services/shells/calendar-collection-shell.js',
        'services/shells/calendar-shell.js',
        'services/shells/rrule-shell.js',
        'services/shells/valarm-shell.js',
        'services/cached-event-source.js',
        'services/calendar-attendee-service.js',
        'services/calendar-current-view.js',
        'services/calendar-event-emitter.js',
        'services/calendar-event-source.js',
        'services/calendar-api.js',
        'services/calendar-explored-period-service.js',
        'services/calendar-home-service.js',
        'services/calendar-restangular.js',
        'services/calendar-service.js',
        'services/calendar-utils.js',
        'services/calendar-visibility-service.js',
        'services/event-api.js',
        'services/event-service.js',
        'services/event-store.js',
        'services/event-utils.js',
        'services/fc-moment.js',
        'services/ical.js',
        'services/master-event-cache.js',
        'services/path-builder.js',
        'services/request.js',
        'services/timezone.js',

        'components/attendee-list-item/attendee-list-item.js',
        'components/attendee-list-item-consult/attendee-list-item-consult.js',
        'components/attendee-list-item-edition/attendee-list-item-edition.js',
        'components/attendees-autocomplete-input/attendees-autocomplete-input.js',
        'components/attendees-list/attendees-list.js',
        'components/calendar-color-picker/calendar-color-picker.js',
        'components/calendar-community-button-toolbar/calendar-community-button-toolbar.directive.js',
        'components/calendars-list/calendars-list.js',
        'components/event-alarm-consultation/event-alarm-consultation.js',
        'components/event-alarm-edition/event-alarm-edition.js',
        'components/event-create-button/event-create-button.js',
        'components/event-date-consultation/event-date-consultation.js',
        'components/event-date-edition/event-date-edition.js',
        'components/event-recurrence-edition/event-recurrence-edition.js',
        'components/mail-to-attendees/mail-to-attendees.js',
        'components/mini-calendar/mini-calendar-mobile.directive.js',
        'components/mini-calendar/mini-calendar.controller.js',
        'components/mini-calendar/mini-calendar.directive.js',
        'components/mini-calendar/mini-calendar.service.js',

        'calendar/calendar-header/calendar-header-content.directive.js',
        'calendar/calendar-header/calendar-header-mobile.directive.js',
        'calendar/calendar-left-pane/calendar-left-pane.directive.js',
        'calendar/calendar-view/calendar-view.controller.js',
        'calendar/calendar-view/calendar-view.directive.js',

        'calendar-configuration/calendar-configuration-header/calendar-configuration-header.directive.js',
        'calendar-configuration/calendars-configuration-header/calendars-configuration-header.directive.js',
        'calendar-configuration/calendar-configuration.directive.js',
        'calendar-configuration/calendars-configuration.directive.js',

        'event-consult-form/event-consult-form-body.directive.js',
        'event-consult-form/event-consult-form-sub-header.directive.js',
        'event-consult-form/event-consult-form.directive.js',

        'event-full-form/event-full-form-sub-header.directive.js',
        'event-full-form/event-full-form.directive.js',

        'event-message/event-message-edition/event-message-edition.controller.js',
        'event-message/event-message-edition/event-message-edition.directive.js',
        'event-message/event-message-edition-button/event-message-edition-button.directive.js',
        'event-message/event-message.directive.js',
        'event-message/event-message.service.js',

        'event-quick-form/event-quick-form.directive.js',

      ];

      webserverWrapper.injectLess('calendar', [path.resolve(__dirname, '../frontend/app/styles.less')], 'esn');
      webserverWrapper.injectAngularAppModules('calendar', jsFiles, ['esn.calendar', 'esn.ical'], ['esn']);
      webserverWrapper.addApp('calendar', app);

      return callback();
    },

    start: function(dependencies, callback) {
      require('./ws/calendar').init(dependencies);
      require('./lib/search')(dependencies).listen();
      callback();
    }
  }
});

/**
 * The main AwesomeModule describing the application.
 * @type {AwesomeModule}
 */
module.exports = AwesomeCalendarModule;
