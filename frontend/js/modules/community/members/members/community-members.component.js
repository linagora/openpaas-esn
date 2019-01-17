(function(angular) {
  'use strict';

  angular.module('esn.community').component('esnCommunityMembers', {
    bindings: {
      community: '='
    },
    controller: 'ESNCommunityMembersController',
    templateUrl: '/views/modules/community/members/members/community-members.html'
  });

})(angular);
