(function(angular) {
  'use strict';

  angular.module('linagora.esn.controlcenter')

    .run(function(dynamicDirectiveService, DynamicDirective) {
      var directive = new DynamicDirective(true, 'profile-menu-controlcenter');

      dynamicDirectiveService.addInjection('profile-menu-link', directive);
    });

})(angular);
