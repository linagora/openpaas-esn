'use strict';

angular.module('esn.configuration')

  .factory('esnConfig', function(session, featureFlags, _) {
    var sessionReady = session.ready.then(function() {
      var configurations = session.user.configurations;
      var featuresConfigName = 'features';

      if (configurations) {
        var flags = reduceConfiguration(configurations, featuresConfigName);

        featureFlags.set(flags.concat(flags));
      }
    });

    return function(key, defaultValue) {
      return sessionReady.then(function() {
        var config = featureFlags.isOn(key);

        return angular.isDefined(config) ? config : defaultValue;
      });
    };

    function reduceConfiguration(configurations, featuresConfigName) {
      var result = configurations.modules.reduce(function(list, module) {
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
            active: config.value,
            value: config.value
          };
        }));
      }, []);

      var coreModules = _.find(result, { key: 'core.modules' }) || [];
      var coreModuleConfiguration = _.map(coreModules.value, function(configuration) {
        return {
          key: 'core.modules.' + configuration.id + '.enabled',
          name: 'core.modules.' + configuration.id + '.enabled',
          active: configuration.enabled,
          value: configuration.enabled
        };
      });

      return result.concat(coreModuleConfiguration);
    }
  });
