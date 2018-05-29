(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactUpdateDataService', contactUpdateDataService);

  function contactUpdateDataService($rootScope, CONTACT_EVENTS) {
    var state = {
      taskId: null,
      contact: null,
      contactUpdatedIds: []
    };

    // workaround to fix issue that cannot update contact 2 times sequentially
    // TODO: rework on contactUpdateDataService to avoid dirty hack
    $rootScope.$on(CONTACT_EVENTS.UPDATED, function(e, data) {
      if (state.contact && state.contact.id === data.id && data.etag) {
        state.contact.etag = data.etag;
      }
    });

    return state;
  }
})(angular);
