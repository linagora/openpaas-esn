'use strict';

angular.module('esn.localstorage', ['LocalForageModule'])
  .config(['$localForageProvider', function($localForageProvider) {
    $localForageProvider.config({
      name: 'esnApp',
      storeName: 'keyvaluepairs'
    });
  }])
  .factory('localStorageService', ['$localForage', function($localForage) {
    return {
      getDefault: function() {
        return $localForage;
      },

      createInstance: function(name, options) {
        options = options || {};
        options.name = name;
        return $localForage.createInstance(options);
      },

      getInstance: function(name) {
        return $localForage.instance(name);
      }
    };
  }]);
