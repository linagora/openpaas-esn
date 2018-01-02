(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .controller('profileOverviewController', profileOverviewController);

  function profileOverviewController($scope) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      $scope.user = self.user;
    }
  }

})(angular);
