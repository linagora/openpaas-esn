'use strict';

angular.module('esn.session', ['esn.user', 'esn.domain', 'ngRoute'])
.factory('session', [function() {
  var session = {
    user: {},
    domain: {}
  };

  function setUser(user) {
    angular.copy(user, session.user);
  }
  function setDomain(domain) {
    angular.copy(domain, session.domain);
  }
  session.setUser = setUser;
  session.setDomain = setDomain;

  return session;

}])
.controller('sessionInitController',
            ['$scope', '$q', 'userAPI', 'domainAPI', 'session', '$route',
             function($scope, $q, userAPI, domainAPI, session) {
  $scope.session = {
    template: '/views/esn/partials/loading.html'
  };
  var onError = function(error) {
    if (error && error.data) {
      $scope.session.error = error.data;
    }
    $scope.session.template = '/views/esn/partials/loading-error.html';
  };

  function fetchUser() {
    userAPI.currentUser().then(function(response) {
      var user = response.data;
      session.setUser(user);
      var domainIds = angular.isArray(user.domains) ?
                      user.domains.map(function(domain) {return domain.domain_id;}) :
                      [];
      if (!domainIds.length) {
        $scope.session.error = {
          error: 400,
          message: 'Invalid user',
          details: 'User does not belong to a domain',
          displayLogout: true
        };
        $scope.session.template = '/views/esn/partials/loading-error.html';
        return;
      }
      fetchDomain(domainIds[0]);
    }, onError);
  }

  function fetchDomain(domainId) {
    domainAPI.get(domainId).then(function(response) {
      session.setDomain(response.data);
      $scope.session.template = '/views/esn/partials/application.html';
    }, onError);
  }

  fetchUser();
}]);
