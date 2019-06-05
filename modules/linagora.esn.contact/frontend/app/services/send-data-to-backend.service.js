(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('sendContactToBackend', sendContactToBackend);

  function sendContactToBackend($q) {
    return function($scope, sendRequest) {
      if ($scope.calling) {
        return $q.reject('The form is already being submitted');
      }

      $scope.calling = true;

      return sendRequest().finally(function() {
        $scope.calling = false;
      });
    };
  }
})(angular);
