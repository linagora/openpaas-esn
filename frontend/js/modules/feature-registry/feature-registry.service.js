(function(angular) {
  'use strict';

  angular.module('esn.feature-registry')
    .factory('esnFeatureRegistry', esnFeatureRegistry);

    function esnFeatureRegistry(esnRegistry) {
      var name = 'esnFeatureRegistry';
      var options = {
        primaryKey: 'name'
      };
      var registry = esnRegistry(name, options);

      return registry;
    }
})(angular);
