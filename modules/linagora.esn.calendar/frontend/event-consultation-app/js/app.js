'use strict';

angular.module('esn.calendar.event-consultation', ['uuid4', 'AngularJstz', 'esn.core', 'esn.lodash-wrapper', 'esn.calendar', 'esn.header', 'esn.ical', 'esn.fcmoment']);

//mock parent calendars to be able to use the consult-form-directive
angular.module('esn.calendar', [])
  .service('eventAPI', angular.noop)
  .service('masterEventCache', angular.noop);

angular.module('esn.header', []).service('headerService', function() {});
