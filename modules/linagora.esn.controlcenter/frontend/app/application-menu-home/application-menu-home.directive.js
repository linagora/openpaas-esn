(function(angular) {
  'use strict';

  angular.module('linagora.esn.controlcenter')
    .directive('applicationMenuHome', function(applicationMenuTemplateBuilder) {
      return {
        retrict: 'E',
        replace: true,
        template: applicationMenuTemplateBuilder('/#/', { name: 'home' }, 'Home')
      };
    });
})(angular);
