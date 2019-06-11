(function() {
  'use strict';

  angular.module('esn.community')
    .constant('COMMUNITY_MODULE_METADATA', {
      id: 'linagora.esn.community',
      title: 'Communities',
      icon: '/images/application-menu/communities-icon.svg',
      homePage: 'community.home',
      disableable: true,
      isDisplayedByDefault: false
    });
})();
