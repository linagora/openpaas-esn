(function() {
  'use strict';

  angular.module('esn.avatar')
    .component('esnAvatarList', esnAvatarList());

  function esnAvatarList() {
    return {
      templateUrl: '/views/modules/avatar/list/avatar-list.html',
      controller: 'ESNAvatarListController',
      bindings: {
        members: '<',
        limit: '=',
        profileLink: '@'
      }
    };
  }
})();
