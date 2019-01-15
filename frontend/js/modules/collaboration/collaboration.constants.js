(function() {
  'use strict';

  angular.module('esn.collaboration')
    .constant('ESN_COLLABORATION_MEMBERSHIP_EVENTS', {
      JOIN: 'collaboration:join',
      LEAVE: 'collaboration:leave'
    })
    .constant('ESN_COLLABORATION_MEMBER_SEARCH_LENGTH', 20)
    .constant('ESN_COLLABORATION_MEMBER_EVENTS', {
      ADDED: 'collaboration:member:added',
      REMOVED: 'collaboration:member:removed',
      USERS: 'collaboration:invite:users',
      CANCEL: 'collaboration:invite:users:cancel',
      ACCEPTED: 'collaboration:request:accepted',
      DECLINED: 'collaboration:request:declined'
    });
})();
