(function(angular) {
  'use strict';

  angular.module('esn.timeline').factory('esnTimelineEntryProviders', esnTimelineEntryProviders);

  function esnTimelineEntryProviders() {
    var providers = {};

    return {
      get: get,
      register: register
    };

    function register(provider) {
      if (!provider || !provider.verb) {
        return;
      }

      if (!providers[provider.verb]) {
        providers[provider.verb] = [];
      }
      providers[provider.verb].push(provider);
    }

    function get(verb) {
      return providers[verb] || [];
    }
  }

})(angular);
