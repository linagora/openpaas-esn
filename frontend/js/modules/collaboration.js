'use strict';

angular.module('esn.collaboration', ['restangular'])
  .factory('collaborationAPI', ['Restangular', function(Restangular) {
    function getWhereMember(tuple) {
      return Restangular.all('collaborations/membersearch').getList(tuple);
    }

    function getMembers(objectType, id, options) {
      return Restangular.one('collaborations').one(objectType, id).all('members').getList(options);
    }

    function getMember(objectType, id, member) {
      return Restangular.one('collaborations').one(objectType, id).one('members', member).get();
    }

    function getExternalCompanies(objectType, id, options) {
      return Restangular.one('collaborations').one(objectType, id).getList('externalcompanies', options);
    }

    return {
      getMembers: getMembers,
      getMember: getMember,
      getWhereMember: getWhereMember,
      getExternalCompanies: getExternalCompanies
    };
  }])
  .controller('collaborationListController', ['$scope', 'domain', 'user', function($scope, domain, user) {
    $scope.domain = domain;
    $scope.user = user;
  }])
  .directive('collaborationCreateButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/collaboration/collaboration-create-button.html'
    };
  })
  .directive('collaborationMembersWidget', ['$rootScope', 'collaborationAPI', function($rootScope, collaborationAPI) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        collaboration: '=',
        objectType: '@'
      },
      templateUrl: '/views/modules/collaboration/collaboration-members-widget.html',
      link: function($scope, element, attrs) {
        $scope.inSlicesOf = attrs.inSlicesOf && angular.isNumber(parseInt(attrs.inSlicesOf, 10)) ?
          parseInt(attrs.inSlicesOf, 10) : 3;
        $scope.error = false;

        function sliceMembers(members) {
          if ($scope.inSlicesOf < 1 || !angular.isArray(members)) {
            return members;
          }
          var array = [];
          for (var i = 0; i < members.length; i++) {
            var chunkIndex = parseInt(i / $scope.inSlicesOf, 10);
            var isFirst = (i % $scope.inSlicesOf === 0);
            if (isFirst) {
              array[chunkIndex] = [];
            }
            array[chunkIndex].push(members[i]);
          }
          return array;
        }

        $scope.updateMembers = function() {
          collaborationAPI.getMembers($scope.objectType, $scope.collaboration._id, { limit: 16 }).then(function(result) {
            var total = parseInt(result.headers('X-ESN-Items-Count'), 10);
            var members = result.data;
            $scope.more = total - members.length;
            $scope.members = sliceMembers(members);
          }, function() {
            $scope.error = true;
          });
        };

        var communityJoinRemover = $rootScope.$on('community:join', $scope.updateMembers);
        var communityLeaveRemover = $rootScope.$on('community:leave', $scope.updateMembers);
        element.on('$destroy', function() {
          communityJoinRemover();
          communityLeaveRemover();
        });
        $scope.updateMembers();
      }
    };
  }])
  .directive('collaborationMemberAvatar', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        member: '=',
        collaboration: '='
      },
      templateUrl: '/views/modules/collaboration/collaboration-member-avatar.html',
      controller: function($scope) {
        var title = '';
        if ($scope.member.user.firstname || $scope.member.user.lastname) {
          title = ($scope.member.user.firstname || '') + ' ' + ($scope.member.user.lastname || '');
        } else {
          title = $scope.member.user.emails[0];
        }

        $scope.tooltip = {
          title: title
        };

        if ($scope.collaboration.creator === $scope.member.user._id) {
          $scope.creator = true;
        }
      }
    };
  });
