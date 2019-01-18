(function(angular) {
  'use strict';

  angular.module('esn.community').run(runBlock);

  function runBlock(
    esnModuleRegistry,
    esnCollaborationRegistry,
    communityService
  ) {
    esnModuleRegistry.add({
      id: 'linagora.esn.community',
      title: 'Communities',
      icon: '/images/application-menu/communities-icon.svg',
      homePage: 'community.home',
      disableable: true
    });

    esnCollaborationRegistry.add({
      objectType: 'community',
      member: {
        isManager: communityService.isManager
      }
    });
  }
})(angular);
