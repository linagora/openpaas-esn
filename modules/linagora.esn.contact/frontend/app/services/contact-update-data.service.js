(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactUpdateDataService', contactUpdateDataService);

  function contactUpdateDataService() {
    return {
      taskId: null,
      contact: null,
      contactUpdatedIds: []
    };
  }
})(angular);
