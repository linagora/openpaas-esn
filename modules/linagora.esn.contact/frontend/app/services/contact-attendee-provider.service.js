(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactAttendeeProvider', ContactAttendeeProvider);

  function ContactAttendeeProvider() {
    return {
      objectType: 'contact',
      templateUrl: '/contact/app/contact/auto-complete/contact-auto-complete.html'
    };
  }

})(angular);
