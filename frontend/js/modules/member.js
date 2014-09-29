'use strict';

angular.module('esn.member', ['ngRoute', 'esn.domain', 'esn.search', 'esn.infinite-list', 'openpaas-logo'])
  .constant('memberSearchConfiguration', {
    searchLimit: 20
  })
  .directive('memberDisplay', function() {
    return {
      restrict: 'E',
      scope: {
        member: '=member'
      },
      templateUrl: '/views/modules/member/member.html'
    };
  }).controller('memberscontroller', ['$scope', 'domainAPI', '$routeParams', 'memberSearchConfiguration', 'usSpinnerService', function($scope, $domainAPI, $routeParams, memberSearchConfiguration, usSpinnerService) {

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
    $scope.restActive = false;
    $scope.error = false;

    var formatResultsCount = function(count) {
      $scope.search.count = count;

      if (count < 1000) {
        $scope.search.formattedCount = count;
      }
      else {
        var len = Math.ceil(Math.log(count + 1) / Math.LN10);
        var num = Math.round(count * Math.pow(10, -(len - 3))) * Math.pow(10, len - 3);

        $scope.search.formattedCount = num.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1 ');
      }
    };

    var updateMembersList = function() {
      $scope.error = false;
      if ($scope.restActive) {
        return;
      }
      else {
        $scope.restActive = true;
        $scope.search.running = true;
        formatResultsCount(0);
        usSpinnerService.spin('memberSpinner');

        $domainAPI.getMembers(domain_id, opts).then(function(data) {
          formatResultsCount(parseInt(data.headers('X-ESN-Items-Count')));
          $scope.members = $scope.members.concat(data.data);
        }, function() {
          $scope.error = true;
        }).finally (function() {
          $scope.search.running = false;
          $scope.restActive = false;
          usSpinnerService.stop('memberSpinner');
        });
      }
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
      if ($scope.members.length === 0 || $scope.members.length < $scope.search.count) {
        opts.offset = $scope.members.length;
        updateMembersList();
      }
    };
  }]);
