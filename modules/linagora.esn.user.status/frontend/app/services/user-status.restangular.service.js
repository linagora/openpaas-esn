(function() {
  'use strict';

  angular.module('linagora.esn.user-status')
    .factory('userStatusRestangular', userStatusRestangular);

  function userStatusRestangular(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/user-status/api');
      RestangularConfigurer.setFullResponse(true);
    });
  }
})();
