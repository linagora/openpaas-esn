'use strict';

angular.module('linagora.esn.admin')

.service('adminDomainConfigService', function($http, $q, _) {
  function get(domainId, configNames) {
    var isArray = true;

    if (!_.isArray(configNames)) {
      configNames = [configNames];
      isArray = false;
    }

    var req = {
      method: 'POST',
      url: '/admin/api/configuration/' + domainId,
      headers: {
        'Content-Type': 'application/json'
      },
      data: { configNames: configNames }
    };

    return $http(req)
      .then(function(response) {
        if (response.status !== 200) {
          return $q.reject(response);
        }

        if (!isArray) {
          var config = response.data.length > 0 ? response.data[0].value : null;

          return config;
        }

        return response.data;
      });
  }

  function set(domainId, configs) {
    if (!_.isArray(configs)) {
      configs = [configs];
    }

    var req = {
      method: 'PUT',
      url: '/admin/api/configuration/' + domainId,
      headers: {
        'Content-Type': 'application/json'
      },
      data: { configs: configs }
    };

    return $http(req).then(function(response) {
      if (response.status !== 200) {
        return $q.reject(response);
      }

      return configs;
    });
  }

  return {
    get: get,
    set: set
  };
});
