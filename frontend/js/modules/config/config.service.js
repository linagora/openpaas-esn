'use strict';

angular.module('esn.configuration')

  .factory('esnConfig', function(session, featureFlags, _) {
    var sessionReady = session.ready.then(function() {
      var configurations = session.user.configurations;
      var featuresConfigName = 'features';

      if (configurations) {
        featureFlags.set(configurations.modules.reduce(function(list, module) {
          var features = _.find(module.configurations, { name: featuresConfigName });

          // flatten the features configuration
          if (features && features.value) {
            _.forEach(features.value, function(value, key) {
              var flattenFeature = {
                name: featuresConfigName + '.' + key,
                value: value
              };

              module.configurations.push(flattenFeature);
            });
          }

          return list.concat(module.configurations.map(function(config) {
            return {
              key: module.name + '.' + config.name,
              name: config.name,
              active: config.value
            };
          }));
        }, []));
      }
    });

    return function(key, defaultValue) {
      return sessionReady.then(function() {
        var config = featureFlags.isOn(key);

        return angular.isDefined(config) ? config : defaultValue;
      });
    };
  });
