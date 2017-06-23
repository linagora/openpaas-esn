'use strict';

angular.module('esn.configuration')

  .constant('ESN_CONFIG_DEFAULT', {
    core: {
      businessHours: [{
        daysOfWeek: [1, 2, 3, 4, 5],
        start: '09:00',
        end: '18:00'
      }]
    }
  })
  .constant('ESN_CONFIG_SCOPE', {
    user: 'user',
    domain: 'domain',
    platform: 'platform'
  });
