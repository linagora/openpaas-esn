(function() {
  'use strict';

  angular.module('esn.module-registry')
    .factory('esnModuleRegistry', esnModuleRegistry);

  function esnModuleRegistry(esnRegistry) {
    var name = 'esnModuleRegistry';
    var options = {
      primaryKey: 'id'
    };
    var registry = esnRegistry(name, options);

    return registry;
  }
})();
