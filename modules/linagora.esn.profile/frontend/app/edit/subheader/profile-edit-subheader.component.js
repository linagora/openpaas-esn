(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .component('profileEditSubheader', {
      templateUrl: '/profile/app/edit/subheader/profile-edit-subheader.html',
      bindings: {
        onSaveBtnClick: '&'
      }
    });
})(angular);
