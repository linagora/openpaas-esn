(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .controller('profileShowFollowerController', profileShowFollowerController);

  function profileShowFollowerController($scope) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      $scope.user = this.user;
    }
  }
})(angular);
