'use strict';

angular.module('esn.session', ['esn.user', 'esn.domain', 'ngRoute'])
.factory('session', ['$q', function($q) {

  var bootstrapDefer = $q.defer();
  var session = {
    user: {},
    domain: {},
    ready: bootstrapDefer.promise
  };

  var sessionIsBootstraped = false;
  function checkBootstrap() {
    if (sessionIsBootstraped) {
      return;
    }
    if (session.user._id &&
        session.domain._id) {
      sessionIsBootstraped = true;
      bootstrapDefer.resolve(session);
    }
  }

  function setUser(user) {
    angular.copy(user, session.user);
    checkBootstrap();
  }

  function setDomain(domain) {
    angular.copy(domain, session.domain);
    checkBootstrap();
  }

  session.setUser = setUser;
  session.setDomain = setDomain;

  return session;
}])

.controller('currentDomainController', ['session', '$scope', function(session, $scope) {
  $scope.domain = session.domain;
}])

.controller('currentCollaborationObjectType', ['$scope', function($scope) {
  var objectType = '';
  if ($scope.activitystream.route === 'communities') {
    objectType = 'community';
  } else if ($scope.activitystream.route === 'projects') {
    objectType = 'project';
  }

  $scope.currentCollaborationObjectType = objectType;
}])

.controller('sessionInitESNController', ['$scope', 'sessionFactory', '$route', function($scope, sessionFactory) {

  $scope.session = {
    template: '/views/commons/loading.html'
  };

  sessionFactory.fetchUser(function(error) {
    if (error) {
      $scope.session.error = error.data;
      $scope.session.template = '/views/commons/loading-error.html';
    } else {
      $scope.session.template = '/views/esn/partials/application.html';
    }
  });
}])

.controller('sessionInitLiveConfController', ['$scope', 'sessionFactory', '$route', function($scope, sessionFactory) {

    $scope.session = {
      template: '/views/commons/loading.html'
    };

    sessionFactory.fetchUser(function(error) {
      if (error) {
        $scope.session.error = error.data;
        $scope.session.template = '/views/commons/loading-error.html';
      } else {
        $scope.session.template = '/views/live-conference/partials/application.html';
      }
    });
  }])

.factory('sessionFactory', ['$log', '$q', 'userAPI', 'domainAPI', 'session',
    function($log, $q, userAPI, domainAPI, session) {

      function onError(error, callback) {
        if (error && error.data) {
          return callback(error.data);
        }
      }

      function fetchUser(callback) {
        userAPI.currentUser().then(function(response) {
          var user = response.data;
          session.setUser(user);
          var domainIds = angular.isArray(user.domains) ?
            user.domains.map(function(domain) {return domain.domain_id;}) :
            [];
          if (!domainIds.length) {
            var error = {
              error: 400,
              message: 'Invalid user',
              details: 'User does not belong to a domain',
              displayLogout: true
            };
            return callback(error);
          }
          fetchDomain(domainIds[0], function(error) {
            if (error) {
              return callback(error);
            }
            callback(null);
          });
        }, function(error) {
          onError(error, callback);
        });
      }

      function fetchDomain(domainId, callback) {
        domainAPI.get(domainId).then(function(response) {
          session.setDomain(response.data);
          return callback(null);
        }, function(error) {
          onError(error, callback);
        });
      }

      return {
        fetchUser: fetchUser
      };
    }]);
