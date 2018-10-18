(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')

    .run(function(dynamicDirectiveService, DynamicDirective) {
      var directive = new DynamicDirective(true, 'profile-menu-profile');

      dynamicDirectiveService.addInjection('profile-menu-profile', directive);
    });

})(angular);
