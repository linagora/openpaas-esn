(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactListToggleEventService', ContactListToggleEventService);

  function ContactListToggleEventService($rootScope, CONTACT_LIST_DISPLAY_EVENTS) {
    return {
      broadcast: broadcast,
      listen: listen
    };

    function broadcast(value) {
      $rootScope.$broadcast(CONTACT_LIST_DISPLAY_EVENTS.toggle, value);
    }

    function listen($scope, callback) {
      return $scope.$on(CONTACT_LIST_DISPLAY_EVENTS.toggle, callback);
    }
  }
})(angular);
