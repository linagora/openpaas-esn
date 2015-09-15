'use strict';

angular.module('esn.http', ['restangular'])

  .config(function($httpProvider) {
    $httpProvider.interceptors.push('redirectWhenNotAuthInterceptor');
  })

  .run(function(Restangular, httpErrorHandler) {
    Restangular.setErrorInterceptor(function(response) {
      if (response.status === 401) {
        httpErrorHandler.redirectToLogin();
      }
      return true;
    });
  })

  .factory('redirectWhenNotAuthInterceptor', function($q, httpErrorHandler) {
    return {
      'responseError': function(rejection) {
        if (rejection.status === 401) {
          httpErrorHandler.redirectToLogin();
        }
        return $q.reject(rejection);
      }
    };
  })

  .factory('httpErrorHandler', function($window, $location, $log) {

    function redirectToLogin() {
      var current = $location.path();
      $log.debug('User is not logged, redirecting to login page from', current);
      $window.location.href = '/login?continue=' + current;
    }

    return {
      redirectToLogin: redirectToLogin
    };
  });
