(function(angular) {
  'use strict';

  angular.module('esn.availability')
    .factory('esnAvailabilityService', esnAvailabilityService);

    function esnAvailabilityService(
      Restangular,
      esnRestangular,
      ESN_AVAILABILITY_RESOURCE_TYPE
    ) {
      return {
        checkEmailAvailability: checkEmailAvailability
      };

      function checkEmailAvailability(email) {
        return getAvailabilityStatus(ESN_AVAILABILITY_RESOURCE_TYPE.EMAIL, email);
      }

      function getAvailabilityStatus(resourceType, resourceId) {
        return esnRestangular
          .one('availability')
          .get({
            resourceType: resourceType,
            resourceId: resourceId
          })
          .then(function(response) {
            return Restangular.stripRestangular(response.data);
          });
      }
    }
})(angular);
