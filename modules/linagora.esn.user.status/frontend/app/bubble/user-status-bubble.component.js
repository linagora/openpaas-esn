(function() {
  'use strict';

  angular.module('linagora.esn.user-status')
    .component('userStatusBubble', userStatusBubble());

  function userStatusBubble() {
    return {
      templateUrl: '/user-status/app/bubble/user-status-bubble.html',
      controller: 'userStatusBubbleController',
      controllerAs: 'ctrl',
      bindings: {
        userId: '<'
      }
    };
  }

})();
