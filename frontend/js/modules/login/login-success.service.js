(function() {
  'use strict';

  angular.module('esn.login')
  .factory('loginSuccessService', function($window) {
    function loginSuccessService() {
      return $window.location.reload();
    }

    return loginSuccessService;
  });
})();
