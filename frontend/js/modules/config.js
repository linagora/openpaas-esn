'use strict';

angular.module('esn.configuration', ['esn.session', 'feature-flags'])

  .constant('ESN_CONFIG_DEFAULT', {
    core: {
      businessHours: [{
        daysOfWeek: [1, 2, 3, 4, 5],
        start: '09:00',
        end: '18:00'
      }]
    }
  })

  .factory('esnConfig', function(session, featureFlags) {
    var sessionReady = session.ready.then(function() {
      var configurations = session.user.configurations;

      if (configurations) {
        featureFlags.set(configurations.modules.reduce(function(list, module) {
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
