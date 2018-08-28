(function(angular) {
  'use strict';

  angular.module('esn.community').run(runBlock);

  function runBlock(
    esnFeatureRegistry,
    esnModuleRegistry
  ) {
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
