'use strict';

angular.module('esn.localstorage', ['esn.session', 'LocalForageModule'])
  .factory('localStorageService', function(session, $localForage) {

    function getName(name) {
      return session.user._id + '.' + name;
    }

    function getDefault() {
      return $localForage.createInstance(getName('esnApp'), {storeName: 'keyvaluepairs'});
    }

    function createInstance(name, options) {
      options = options || {};
      options.name = getName(name);
      return $localForage.createInstance(options);
    }

    function getInstance(name) {
      return $localForage.instance(getName(name));
    }

    function getOrCreateInstance(name, options) {
      options = options || {};
      var instance;

      try {
        instance = getInstance(name);
      } catch (Error) {
        instance = createInstance(name, options);
      }
      return instance;
    }

    return {
      getDefault: getDefault,
      createInstance: createInstance,
      getInstance: getInstance,
      getOrCreateInstance: getOrCreateInstance
    };
  });
