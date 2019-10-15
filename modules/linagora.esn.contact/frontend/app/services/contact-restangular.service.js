(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactRestangularService', contactRestangularService);

  function contactRestangularService(Restangular, httpErrorHandler) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setFullResponse(true);
      RestangularConfigurer.setBaseUrl('/contact/api');
      RestangularConfigurer.setErrorInterceptor(function(response) {
        if (response.status === 401) {
          httpErrorHandler.redirectToLogin();
        }

        return true;
      });
    });
  }
})(angular);
