(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .controller('profileShowFollowingController', profileShowFollowingController);

  function profileShowFollowingController($scope) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      $scope.user = this.user;
    }
  }
})(angular);
