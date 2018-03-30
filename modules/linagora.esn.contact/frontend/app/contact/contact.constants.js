(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .constant('CONTACT_EVENTS', {
      CREATED: 'contact:created',
      UPDATED: 'contact:updated',
      DELETED: 'contact:deleted',
      CANCEL_UPDATE: 'contact:cancel:update',
      CANCEL_DELETE: 'contact:cancel:delete'
    });
})(angular);
