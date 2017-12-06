(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .controller('profileTabsController', profileTabsController);

  function profileTabsController($scope) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      // because of scope inheritance...
      $scope.user = self.user;
    }
  }
})(angular);
