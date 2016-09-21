
(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('calendarRestangular', calendarRestangular);

  calendarRestangular.$inject = [
    'Restangular'
  ];

  function calendarRestangular(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/calendar/api/calendars');
      RestangularConfigurer.setFullResponse(true);
    });
  }

})();
