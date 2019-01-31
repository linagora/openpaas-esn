(function(angular) {
  'use strict';

  angular.module('esn.community').component('esnCommunityMembersTabs', {
    bindings: {
      community: '='
    },
    controller: 'ESNCommunityMembersTabsController',
    templateUrl: '/views/modules/community/members/tabs/community-members-tabs.html'
  });

})(angular);
