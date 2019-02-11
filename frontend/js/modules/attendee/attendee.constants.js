(function(angular) {
  'use strict';

  angular.module('esn.attendee')
    .constant('ESN_ATTENDEE_DEFAULT_TEMPLATE_URL', '/views/modules/attendee/attendee-auto-complete.html')
    .constant('ESN_ATTENDEE_DEFAULT_OBJECT_TYPE', 'user');

})(angular);
