(function() {
  'use strict';

  angular.module('esn.message')
    .factory('esnMessageRegistry', esnMessageRegistry);

  function esnMessageRegistry(esnRegistry) {
    var name = 'esnMessageRegistry';
    var options = {
      primaryKey: 'objectType'
    };
    var registry = esnRegistry(name, options);

    return registry;
  }
})();
