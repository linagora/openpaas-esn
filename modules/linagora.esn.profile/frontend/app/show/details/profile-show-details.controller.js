(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .controller('profileShowDetailsController', profileShowDetailsController);

  function profileShowDetailsController(profileHelpersService) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      self.canEdit = profileHelpersService.canEdit(self.user);
    }
  }
})(angular);
