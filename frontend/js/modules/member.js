'use strict';

angular.module('esn.member', ['ngRoute', 'esn.domain', 'esn.search', 'esn.infinite-list', 'angularSpinner'])
  .constant('memberSearchConfiguration', {
    searchLimit: 20
  })
  .directive('memberDisplay', function() {
    return {
      restrict: 'E',
      scope: {
        member: '=member'
      },
      templateUrl: '/views/member/partials/member.html'
    };
  }).controller('memberscontroller', ['$scope', 'domainAPI', '$routeParams', 'memberSearchConfiguration', function($scope, $domainAPI, $routeParams, memberSearchConfiguration) {

    var domain_id = $routeParams.domain_id;
    $scope.spinnerKey = 'memberSpinner';

    var opts = {
      offset: 0,
      limit: memberSearchConfiguration.searchLimit,
      search: ''
    };

    $scope.search = {
      running: false
    };
    $scope.members = [];

    var updateMembersList = function() {
      $scope.search.running = true;

      $domainAPI.getMembers(domain_id, opts).then(function(data) {
        $scope.members = $scope.members.concat(data);
        $scope.search.running = false;
      });
    };

    $scope.init = function() {
      //initializes the view with a list of users of the domain
      updateMembersList();
    };

    $scope.doSearch = function() {
      $scope.members = [];
      opts.offset = 0;
      opts.search = $scope.searchInput;
      updateMembersList();
    };

    $scope.loadMoreElements = function() {
      opts.offset = $scope.members.length;
      updateMembersList();
    };
  }]);
