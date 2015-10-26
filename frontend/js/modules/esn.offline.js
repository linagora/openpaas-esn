/*global Offline*/

'use strict';

angular.module('esn.offline-wrapper', [])
  .factory('Offline', function() {
    return Offline;
  })

  .run(function(Offline) {
    Offline.options = {checks: {xhr: {url: '/#/unifiedinbox'}}};
  });
