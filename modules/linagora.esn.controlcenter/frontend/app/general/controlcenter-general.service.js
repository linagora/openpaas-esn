(function() {
  'use strict';

  angular.module('linagora.esn.controlcenter')
    .factory('controlcenterGeneralService', controlcenterGeneralService);

  function controlcenterGeneralService(esnModuleRegistry, _) {
    return {
      getHomePageCandidates: getHomePageCandidates
    };

    function getHomePageCandidates() {
      var modules = esnModuleRegistry.getAll();
      var homePages = {};

      _.forEach(modules, function(module) {
        if (module.title && module.homePage) {
          homePages[module.homePage] = module.title;
        }
      });

      return homePages;
    }
  }
})();
