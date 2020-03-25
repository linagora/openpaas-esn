(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .component('profileEditForm', {
      templateUrl: '/profile/app/edit/form/profile-edit-form.html',
      bindings: {
        user: '=',
        canEditEmails: '<',
        provisionedFields: '<'
      }
    });
})(angular);
