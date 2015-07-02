'use strict';

angular.module('linagora.esn.graceperiod')

  .factory('GracePeriodRestangular', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/graceperiod/api');
      RestangularConfigurer.setFullResponse(true);
    });
  })

  .factory('gracePeriodService', ['GracePeriodRestangular', function(GracePeriodRestangular) {

    function cancel(id) {
      return GracePeriodRestangular.one('tasks').one(id).remove();
    }

    return {
      cancel: cancel
    };

  }]);
