(function() {
  'use strict';

  angular.module('esn.collaboration')
    .constant('ESN_COLLABORATION_MEMBERSHIP_EVENTS', {
      JOIN: 'collaboration:join',
      LEAVE: 'collaboration:leave'
    }).constant('ESN_COLLABORATION_MEMBER_EVENTS', {
      REMOVED: 'collaboration:member:removed'
    });
})();
