(function() {
  'use strict';

  angular.module('linagora.esn.user-status')
    .constant('USER_STATUS', {connected: 'connected', disconnected: 'disconnected', unknown: 'unknown'})
    .constant('USER_STATUS_EVENTS', {
      USER_CHANGE_STATE: 'user:status'
    })
    .constant('USER_STATUS_NAMESPACE', '/userstatus')
    .constant('USER_STATUS_SYNC_INTERVAL', 30000);
})();
