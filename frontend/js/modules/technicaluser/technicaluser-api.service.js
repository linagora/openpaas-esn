(function(angular) {
  'use strict';

  angular.module('esn.technicaluser')

    .factory('esnTechnicalUserAPIClient', esnTechnicalUserAPIClient);

  function esnTechnicalUserAPIClient(esnRestangular, Restangular) {
    return {
      list: list
    };

    function list(domainId, options) {

      return esnRestangular.one('domains', domainId).all('technicalusers').getList(options)
        .then(function(response) {
          return Restangular.stripRestangular(response.data);
        });
    }
  }
})(angular);
