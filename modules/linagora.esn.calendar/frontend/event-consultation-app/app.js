(function() {
  'use strict';

  angular.module('esn.calendar.event-consultation', [
    'uuid4',
    'AngularJstz',
    'esn.core',
    'esn.lodash-wrapper',
    'esn.calendar',
    'esn.header',
    'esn.ical',
    'esn.calMoment',
    'esn.application-menu',
    'op.dynamicDirective',
    'mgcrea.ngStrap.popover'
  ])
  .config(['dynamicDirectiveServiceProvider', function(dynamicDirectiveServiceProvider) {
    var calendar = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-calendar', {priority: 40});

    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', calendar);
  }]);

  //mock parent calendars to be able to use the consult-form-directive
  angular.module('esn.calendar', [])
    .service('calEventAPI', angular.noop)
    .service('calMasterEventCache', angular.noop);

  angular.module('esn.header', []).service('headerService', function() {});
})();
