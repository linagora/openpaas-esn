(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .factory('profileAPI', profileAPI);

  function profileAPI(esnRestangular) {
    return {
      updateProfileField: updateProfileField,
      updateProfile: updateProfile
    };

    function updateProfileField(fieldName, fieldValue) {
      var payload = {
        value: fieldValue
      };

      return esnRestangular.one('user/profile', fieldName).customPUT(payload);
    }

    function updateProfile(profile) {
      return esnRestangular.one('user/profile').customPUT(profile);
    }
  }
})(angular);
