(function(angular) {
  'use strict';

  angular.module('esn.community').config(configBlock);

  function configBlock(tagsInputConfigProvider, dynamicDirectiveServiceProvider) {
    tagsInputConfigProvider.setActiveInterpolation('tagsInput', {
      placeholder: true,
      displayProperty: true
    });

    var community = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-community', {priority: 30});

    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', community);
  }
})(angular);
