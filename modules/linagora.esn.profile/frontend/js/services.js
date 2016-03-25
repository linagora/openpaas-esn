'use strict';

angular.module('linagora.esn.profile')
  .factory('profileAPI', function(esnRestangular) {
    function updateProfileField(fieldName, fieldValue) {
      var payload = {
        value: fieldValue
      };
      return esnRestangular.one('user/profile', fieldName).customPUT(payload);
    }

    return {
      updateProfileField: updateProfileField
    };
  });
