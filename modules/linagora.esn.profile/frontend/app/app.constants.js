(function() {
  'use strict';

  angular.module('linagora.esn.profile')
    .constant('PROFILE_MODULE_METADATA', {
      id: 'linagora.esn.profile',
      title: 'Profile',
      homePage: 'profile',
      icon: '/images/application.png',
      disableable: false,
      isDisplayedByDefault: false
    });
})();
