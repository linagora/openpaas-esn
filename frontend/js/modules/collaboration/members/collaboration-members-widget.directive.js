(function() {
  'use strict';

  angular.module('esn.collaboration')
    .directive('esnCollaborationMembersWidget', esnCollaborationMembersWidget);

  function esnCollaborationMembersWidget($rootScope, esnCollaborationClientService, ESN_COLLABORATION_MEMBER_EVENTS, ESN_COLLABORATION_MEMBERSHIP_EVENTS) {
    return {
      scope: {
        collaboration: '=',
        objectType: '@',
        objectTypeFilter: '@'
      },
      link: link,
      templateUrl: '/views/modules/collaboration/members/collaboration-members-widget.html'
    };

    function link(scope, element, attrs) {
      scope.updateMembers = updateMembers;
      scope.inSlicesOf = attrs.inSlicesOf && angular.isNumber(parseInt(attrs.inSlicesOf, 10)) ?
        parseInt(attrs.inSlicesOf, 10) : 3;
      scope.error = false;
      var query = { limit: 8 };

      if (scope.objectTypeFilter) {
        query.objectTypeFilter = scope.objectTypeFilter;
      }

      var collaborationJoinRemover = $rootScope.$on(ESN_COLLABORATION_MEMBERSHIP_EVENTS.JOIN, scope.updateMembers);
      var collaborationLeaveRemover = $rootScope.$on(ESN_COLLABORATION_MEMBERSHIP_EVENTS.LEAVE, scope.updateMembers);
      var requestAccepted = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.ACCEPTED, scope.updateMembers);
      var memberRemoved = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.REMOVED, scope.updateMembers);

      element.on('$destroy', function() {
        collaborationJoinRemover();
        collaborationLeaveRemover();
        requestAccepted();
        memberRemoved();
      });

      scope.updateMembers();

      function updateMembers() {
        esnCollaborationClientService.getMembers(scope.objectType, scope.collaboration._id, query).then(function(result) {
          var members = result.data;

          scope.more = parseInt(result.headers('X-ESN-Items-Count'), 10) - members.length;
          scope.members = members;
        }, function() {
          scope.error = true;
        });
      }
    }
  }
})();
