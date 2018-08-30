(function(angular) {
  'use strict';

  angular.module('esn.community').run(runBlock);

  function runBlock(
    esnModuleRegistry
  ) {
    esnModuleRegistry.add({
      id: 'linagora.esn.community',
      title: 'Communities',
      icon: '/images/application-menu/communities-icon.svg',
      homePage: 'community',
      disableable: true
    });
  }
})(angular);
