'use strict';

angular.module('esn.configuration', ['esn.session', 'feature-flags'])

  .factory('esnConfig', function(featureFlags) {
    return function(key, defaultValue) {
      var feature = featureFlags.isOn(key);

      return angular.isDefined(feature) ? feature : defaultValue;
    };
  })

  .run(function(session, featureFlags) {
    session.ready.then(function() {
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
  });
