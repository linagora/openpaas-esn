(function() {
  'use strict';

  angular.module('esn.collaboration')
    .constant('ESN_COLLABORATION_MEMBERSHIP_EVENTS', {
      JOIN: 'collaboration:join',
      LEAVE: 'collaboration:leave'
    });
})();
