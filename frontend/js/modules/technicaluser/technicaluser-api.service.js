(function(angular) {
  'use strict';

  angular.module('esn.technicaluser')

    .factory('esnTechnicalUserAPIClient', esnTechnicalUserAPIClient);

  function esnTechnicalUserAPIClient(esnRestangular, Restangular) {
    return {
      list: list,
      listForDomain: listForDomain,
      add: add,
      update: update,
      remove: remove
    };

    function list(options) {
      return esnRestangular.all('technicalusers').getList(options)
        .then(function(response) {
          return Restangular.stripRestangular(response.data);
        });
    }

    function listForDomain(domainId, options) {
      return esnRestangular.one('domains', domainId).all('technicalusers').getList(options)
        .then(function(response) {
          return Restangular.stripRestangular(response.data);
        });
    }

    function add(domainId, technicalUser) {
      return esnRestangular.one('domains', domainId).all('technicalusers').post(technicalUser)
        .then(function(response) {
          return Restangular.stripRestangular(response.data);
        });
    }

    function update(domainId, technicalUser) {
      return esnRestangular.one('domains', domainId).one('technicalusers', technicalUser._id).customPUT(technicalUser);
    }

    function remove(domainId, technicalUser) {
      return esnRestangular.one('domains', domainId).one('technicalusers', technicalUser._id).remove();
    }
  }
})(angular);
