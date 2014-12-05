'use strict';

angular.module('esn.project')
  .directive('projectAddCommunitiesWidget', ['$q', 'projectAPI',
    function($q, projectAPI) {
      return {
        restrict: 'E',
        replace: true,
        scope: {
          project: '='
        },
        templateUrl: '/views/project-add-community-widget.html',
        link: function($scope) {
          $scope.placeholder = 'Enter community name';
          $scope.displayProperty = 'displayName';
          $scope.running = false;

          $scope.getInvitableCommunities = function(query) {
            var deferred = $q.defer();
            deferred.resolve({});
            return deferred.promise;
          };

          $scope.addMembers = function() {
            if (!$scope.members || $scope.members.length === 0) {
              return;
            }
            if ($scope.running) {
              return;
            }

            $scope.running = true;
            $scope.success = false;

            var promises = [];
            $scope.members.forEach(function(member) {
              promises.push(projectAPI.addMember($scope.project._id, member));
            });

            $q.all(promises).then(
              function() {
                $scope.members = [];
                $scope.running = false;
                $scope.success = true;
              },
              function() {
                $scope.members = [];
                $scope.error = true;
                $scope.running = false;
                $scope.success = false;
              }
            );
          };
        }
      };
    }])
  .directive('projectDescription', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/projects/views/project-description.html'
    };
  });
