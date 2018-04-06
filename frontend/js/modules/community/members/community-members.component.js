(function(angular) {
  'use strict';

  angular.module('esn.community').component('communityMembers', {
    bindings: {
      community: '='
    },
    controller: 'communityMembersController',
    templateUrl: '/views/modules/community/members/community-members.html'
  });

})(angular);
