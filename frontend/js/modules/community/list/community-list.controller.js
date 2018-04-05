(function(angular) {
  'use strict';

  angular.module('esn.community').controller('communityListController', communityListController);

  function communityListController($scope, $log, $location, communityAPI, userAPI, domain, user) {
    $scope.communities = [];
    $scope.error = false;
    $scope.loading = false;
    $scope.user = user;
    $scope.domain = domain;
    $scope.selected = '';
    $scope.filter = '';

    $scope.setFilter = function(filter) {
      $scope.filter = filter;
    };

    $scope.getAll = function() {
      $scope.selected = 'all';
      $scope.loading = true;
      communityAPI.list(domain._id)
        .then(function(response) {
          $scope.communities = response.data;
        }, function(err) {
          $log.error('Error while getting communities', err);
          $scope.error = true;
          $scope.communities = [];
        })
        .finally(function() {
          $scope.loading = false;
        });
    };

    $scope.getMembership = function() {
      $scope.selected = 'membership';
      $scope.loading = true;

      userAPI.getCommunities()
        .then(function(response) {
          $scope.communities = response.data;
        }, function(err) {
          $log.error('Error while getting communities', err);
          $scope.error = true;
          $scope.communities = [];
        })
        .finally(function() {
          $scope.loading = false;
        });
    };

    $scope.getModerator = function() {
      $scope.selected = 'moderator';

      $scope.loading = true;
      var options = {
        creator: user._id
      };

      communityAPI.list(domain._id, options)
        .then(function(response) {
          $scope.communities = response.data;
        },
        function(err) {
          $log.error('Error while getting communities', err);
          $scope.error = true;
          $scope.communities = [];
        })
        .finally(function() {
          $scope.loading = false;
        });
    };

    $scope.getAll();
  }
})(angular);
