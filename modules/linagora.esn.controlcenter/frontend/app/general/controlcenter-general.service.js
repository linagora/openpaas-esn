(function() {
  'use strict';

  angular.module('linagora.esn.controlcenter')
    .factory('controlcenterGeneralService', controlcenterGeneralService);

  function controlcenterGeneralService(_, esnI18nService, esnModuleRegistry) {
    return {
      getHomePageCandidates: getHomePageCandidates
    };

    function getHomePageCandidates() {
      var modules = esnModuleRegistry.getAll();
      var homePages = {};

      _.forEach(modules, function(module) {
        if (module.title && module.homePage) {
          homePages[module.homePage] = esnI18nService.translate(module.title);
        }
      });

      return homePages;
    }
  }
})();
