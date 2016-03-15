'use strict';

angular.module('esn.configuration', ['esn.session', 'feature-flags'])

  .factory('esnConfig', function(session, featureFlags) {
    var sessionReady = session.ready.then(function() {
      var features = session.user.features;

      if (features) {
        featureFlags.set(features.modules.reduce(function(list, module) {
          return list.concat(module.features.map(function(feature) {
            return {
              key: module.name + '.' + feature.name,
              name: feature.name,
              active: feature.value
            };
          }));
        }, []));
      }
    });

    return function(key, defaultValue) {
      return sessionReady.then(function() {
        var feature = featureFlags.isOn(key);

        return angular.isDefined(feature) ? feature : defaultValue;
      });
    };
  });
