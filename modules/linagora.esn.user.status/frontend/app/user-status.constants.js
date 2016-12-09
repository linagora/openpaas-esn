(function() {
  'use strict';

  angular.module('linagora.esn.user-status')
    .constant('USER_STATUS', {online: 'online', offline: 'offline'})
    .constant('USER_STATUS_EVENTS', {
      USER_CHANGE_STATE: 'user:status'
    })
    .constant('USER_STATUS_NAMESPACE', '/userstatus');
})();
