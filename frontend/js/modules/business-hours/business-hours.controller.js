(function(angular) {
  'use strict';

  angular.module('esn.business-hours')
    .controller('esnBusinessHoursController', esnBusinessHoursController);

  function esnBusinessHoursController(_, ESN_CONFIG_DEFAULT) {
    var self = this;
    var DEFAULT_BUSINESS_HOURS = ESN_CONFIG_DEFAULT.core.businessHours;

    self.$onInit = $onInit;

    function $onInit() {
      self.businessHours = getDefaultIfEmpty(self.businessHours);
      self.businessHour = self.businessHours[0]; // only support one range for now
    }

    function getDefaultIfEmpty(businessHours) {
      if (_.isEmpty(businessHours)) {
        return angular.copy(DEFAULT_BUSINESS_HOURS);
      }

      return businessHours;
    }
  }
})(angular);
