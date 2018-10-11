'use strict';

angular.module('esn.http', [
  'esn.constants',
  'restangular'
])

  .factory('esnRestangular', function(Restangular, httpConfigurer, httpErrorHandler) {
    var restangularInstance = Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setFullResponse(true);
      RestangularConfigurer.setErrorInterceptor(function(response) {
        if (response.status === 401) {
          httpErrorHandler.redirectToLogin();
        }

        return true;
      });
    });

    httpConfigurer.manageRestangular(restangularInstance, '/api');

    return restangularInstance;
  })
  .factory('redirectWhenNotAuthInterceptor', function($q, httpErrorHandler) {
    return {
      responseError: function(rejection) {
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

      if (!$location.$$html5) { // so far, we already hardcoded the # everywhere...
        current = '#' + $location.hash() + current;
      }

      $log.debug('User is not logged, redirecting to login page from', current);
      $window.location.href = '/login?continue=' + current;
    }

    return {
      redirectToLogin: redirectToLogin
    };
  })

  .provider('httpConfigurer', function() {
    var restangulars = [];
    var baseUrl = '';

    function setBaseUrl(newBaseUrl) {
      baseUrl = newBaseUrl.replace(/\/$/, '');
      restangulars.forEach(updateRestangularBaseUrl);
    }

    function getUrl(uri) {
      if (angular.isUndefined(uri)) {
        uri = '';
      }

      return baseUrl + uri;
    }

    function updateRestangularBaseUrl(moduleRestangular) {
      moduleRestangular.restangular.setBaseUrl(getUrl(moduleRestangular.baseUri));
    }

    function manageRestangular(restangular, baseUri) {
      var moduleRestangular = {restangular: restangular, baseUri: baseUri};

      updateRestangularBaseUrl(moduleRestangular);
      restangulars.push(moduleRestangular);
    }

    this.setBaseUrl = setBaseUrl;
    this.getUrl = getUrl;
    this.$get = function() {
      return {
        setBaseUrl: setBaseUrl,
        manageRestangular: manageRestangular,
        getUrl: getUrl
      };
    };
  });
