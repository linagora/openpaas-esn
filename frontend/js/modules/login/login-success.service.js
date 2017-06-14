(function() {
  'use strict';

  angular.module('esn.login')
  .factory('esnLoginSuccessService', function($window, $q) {
    function loginSuccessService() {
      return $q(function(resolve) {
        $window.location.reload();
        resolve();
      });
    }

    return loginSuccessService;
  });
})();
