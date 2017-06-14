(function() {
  'use strict';

  angular.module('linagora.esn.graceperiod')

    .factory('gracePeriodRestangularService', function(Restangular, httpConfigurer) {
      var restangularInstance = Restangular.withConfig(function(RestangularConfigurer) {
        RestangularConfigurer.setFullResponse(true);
      });

      httpConfigurer.manageRestangular(restangularInstance, '/graceperiod/api');

      return restangularInstance;
    });
})();
