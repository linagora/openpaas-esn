'use strict';

angular.module('esnApp', ['restangular', 'ngRoute', 'esn.member', 'esn.domain'])
  .config(function($routeProvider, RestangularProvider) {

    $routeProvider.when('/', {
      templateUrl: '/views/esn/partials/home'
    });

    $routeProvider.when('/members', {
      templateUrl: '/views/esn/partials/members'
    });

    $routeProvider.when('/domains/:id/members/invite', {
      templateUrl: '/views/esn/partials/domains/invite',
      controller: 'inviteMembers',
      resolve: {
        domain: function(domainAPI, $route, $location) {
          return domainAPI.isManager($route.current.params.id).then(
            function(data) {
              return data;
            },
            function(err) {
              $location.path('/');
            }
          );
        }
      }
    });

    $routeProvider.when('/account', {
      templateUrl: '/views/esn/partials/account'
    });

    $routeProvider.when('/domains/:domain_id/members', {
      templateUrl: '/views/esn/partials/members',
      controller: 'memberscontroller'
    });

    $routeProvider.otherwise({redirectTo: '/'});

    RestangularProvider.setBaseUrl('/api');
    RestangularProvider.setFullResponse(true);
  });
