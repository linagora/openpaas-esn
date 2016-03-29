'use strict';

angular.module('linagora.esn.profile')
  .factory('profileAPI', function(esnRestangular) {
    function updateProfileField(fieldName, fieldValue) {
      var payload = {
        value: fieldValue
      };
      return esnRestangular.one('user/profile', fieldName).customPUT(payload);
    }

    function updateProfile(profile) {
      return esnRestangular.one('user/profile').customPUT(profile);
    }

    return {
      updateProfileField: updateProfileField,
      updateProfile: updateProfile
    };
  });
