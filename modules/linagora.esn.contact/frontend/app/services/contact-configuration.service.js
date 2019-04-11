(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').factory('contactConfiguration', contactConfiguration);

  function contactConfiguration(esnConfig) {

    return {
      get: get
    };

    function get(key, defaultValue) {
      return esnConfig('core.modules.linagora.esn.contact.' + key, defaultValue);
    }
  }
})(angular);
