(function(angular) {
  'use strict';

  angular.module('esn.community').run(runBlock);

  function runBlock(
    objectTypeResolver,
    objectTypeAdapter,
    communityAPI,
    communityAdapterService,
    esnRestangular,
    ASTrackerSubscriptionService,
    esnFeatureRegistry,
    esnModuleRegistry
  ) {
    objectTypeResolver.register('community', communityAPI.get);
    objectTypeAdapter.register('community', communityAdapterService);
    esnRestangular.extendModel('communities', function(model) {
      return communityAdapterService(model);
    });
    ASTrackerSubscriptionService.register('community', {get: communityAPI.get});
    esnFeatureRegistry.add({
      name: 'Communities',
      configurations: [
        {
          displayIn: 'Application Menu',
          name: 'application-menu:communities'
        }
      ],
      description: 'Provide a gathering place for groups of user where they can communicate, make polls, discussion'
    });
    esnModuleRegistry.add({
      id: 'esn.community',
      title: 'Communities',
      icon: '/images/application-menu/communities-icon.svg',
      homePage: 'community'
    });
  }
})(angular);
