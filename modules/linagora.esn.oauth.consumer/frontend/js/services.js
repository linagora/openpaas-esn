'use strict';

angular.module('linagora.esn.oauth')

  .factory('oauthStrategyRegistry', function() {

    var strategies = [];

    function register(name, strategy) {
      if (!name || !strategy) {
        throw new Error('Name and strategy ar required');
      }
      strategies[name] = strategy;
    }

    function get(name) {
      return strategies[name];
    }

    return {
      register: register,
      get: get
    };

  })

  .factory('oauthWorkflow', function($window) {

    function redirect(url) {
      if (!url) {
        return;
      }
      $window.location.href = url;
    }

    return {
      redirect: redirect
    };
  });
