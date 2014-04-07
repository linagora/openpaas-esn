'use strict';

angular.module('esnApp', ['restangular', 'esn.domain', 'ngRoute', 'esn.member', 'esn.search', 'esn.infinite-list', 'angularSpinner'])
  .config(function($routeProvider, RestangularProvider) {

    $routeProvider.when('/', {
      templateUrl: '/views/esn/partials/home'
    });

    $routeProvider.when('/account', {
      templateUrl: '/views/esn/partials/account'
    });

    $routeProvider.when('/domains/:id/members', {
      templateUrl: '/views/esn/partials/members',
      controller: 'memberscontroller'
    });

    $routeProvider.otherwise({redirectTo: '/'});

    RestangularProvider.setBaseUrl('/api');
  }).controller('memberscontroller', ['$scope', 'domainAPI', '$route', function($scope, $domainAPI, $route) {

    var domain_id = $route.current.params.id;
    $scope.spinnerKey = 'memberSpinner';

    var opts = {
      offset: 0,
      limit: 20,
      search: ''
    };

    $scope.search = {
      running: false
    };

    $scope.members = [];

    var updateMembersList = function(){
      $scope.search.running = true;

      console.log('UPDATE');
      console.log($domainAPI);
      console.log($scope);

      $domainAPI.getMembers(domain_id, opts).then(function(data){
        $scope.members = $scope.members.concat(data);
        $scope.search.running = false;
      });
    };

    //updateMembersList();

    $scope.doSearch = function(){
      $scope.members = [];
      opts.offset = 0;
      opts.search = $scope.searchInput;
      updateMembersList();
    };

    $scope.loadMoreElements = function(){
      opts.offset += opts.limit ;
      updateMembersList();
    };
  }]);