(function() {
  'use strict';

  angular.module('esn.community')
    .directive('applicationMenuCommunity', applicationMenuCommunity);

  function applicationMenuCommunity(applicationMenuTemplateBuilder, COMMUNITY_MODULE_METADATA) {
    var directive = {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/community', { url: COMMUNITY_MODULE_METADATA.icon }, 'Communities', 'core.modules.linagora.esn.community.enabled', COMMUNITY_MODULE_METADATA.isDisplayedByDefault)
    };

    return directive;
  }
})();
