(function(angular) {
  'use strict';

  angular.module('esn.community').component('esnCommunityMembersRequests', {
    bindings: {
      community: '='
    },
    controller: 'ESNCommunityMembersRequestsController',
    templateUrl: '/views/modules/community/members/requests/community-members-requests.html'
  });

})(angular);
