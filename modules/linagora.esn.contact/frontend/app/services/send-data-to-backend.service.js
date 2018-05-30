(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('sendContactToBackend', sendContactToBackend);

  function sendContactToBackend($location, ContactsHelper, $q) {
    return function($scope, sendRequest) {
      if ($scope.calling) {
        return $q.reject('The form is already being submitted');
      }

      $scope.contact.displayName = ContactsHelper.getFormattedName($scope.contact);
      if (!$scope.contact.displayName) {
        return $q.reject('Please fill at least a field');
      }

      $scope.calling = true;

      return sendRequest().finally(function() {
        $scope.calling = false;
      });
    };
  }
})(angular);
