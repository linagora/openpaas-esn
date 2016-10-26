(function() {
  'use strict';

  angular.module('linagora.esn.graceperiod')

    .factory('gracePeriodRestangularService', function(Restangular) {
      return Restangular.withConfig(function(RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl('/graceperiod/api');
        RestangularConfigurer.setFullResponse(true);
      });
    });
})();
