
(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('calendarRestangular', calendarRestangular);

  function calendarRestangular(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/calendar/api/calendars');
      RestangularConfigurer.setFullResponse(true);
    });
  }

})();
