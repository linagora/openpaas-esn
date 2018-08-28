(function(angular) {
  'use strict';

  angular.module('esn.community').run(runBlock);

  function runBlock(
    objectTypeResolver,
    objectTypeAdapter,
    communityAPI,
    communityAdapterService,
    esnRestangular,
    ASTrackerSubscriptionService
  ) {
    objectTypeResolver.register('community', communityAPI.get);
    objectTypeAdapter.register('community', communityAdapterService);
    esnRestangular.extendModel('communities', function(model) {
      return communityAdapterService(model);
    });
    ASTrackerSubscriptionService.register('community', {get: communityAPI.get});
  }
})(angular);
