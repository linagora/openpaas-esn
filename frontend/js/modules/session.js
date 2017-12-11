'use strict';

angular.module('esn.session', ['esn.user', 'esn.domain', 'esn.template'])
.factory('session', function($q) {

  var bootstrapDefer = $q.defer();
  var loggedIn = false;

  var session = {
    user: {},
    domain: {},
    ready: bootstrapDefer.promise,
    isLoggedIn: isLoggedIn,
    setLogout: setLogout,
    setLogin: setLogin,
    getProviderAccounts: function(provider) {
      if (!provider) {
        return [];
      }

      return (session.user.accounts || [])
        .filter(function(account) {
          return account.data && account.data.provider === provider;
        }).map(function(account) {
          return account.data;
        });
    },
    userIsDomainAdministrator: function() {
      if (session.domain.administrator === session.user._id) {
        return true;
      }

      if (!Array.isArray(session.domain.administrators)) {
        return false;
      }

      return session.domain.administrators.some(function(administrator) {
        return administrator.user_id === session.user._id;
      });
    }
  };

  function isLoggedIn() {
    return loggedIn;
  }

  function setLogout() {
    loggedIn = false;
  }

  function setLogin() {
    loggedIn = true;
  }

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

    var emailMap = session.user.emailMap = Object.create(null);

    session.user.emails.forEach(function(em) {
      emailMap[em] = true;
    });
    checkBootstrap();
  }

  function setDomain(domain) {
    angular.copy(domain, session.domain);
    checkBootstrap();
  }

  session.setUser = setUser;
  session.setDomain = setDomain;

  return session;
})

.controller('currentDomainController', function(session, $scope) {
  $scope.domain = session.domain;
})

.controller('sessionInitESNController', function($scope, esnTemplate, sessionFactory) {

  $scope.session = {
    template: esnTemplate.templates.loading
  };

  sessionFactory.fetchUser(function(error) {
    if (error) {
      $scope.session.error = error.data;
      $scope.session.template = esnTemplate.templates.error;
    } else {
      $scope.session.template = esnTemplate.templates.success;
    }
  });
})

.factory('sessionFactory', function($log, $q, Restangular, userAPI, domainAPI, session) {

  function onError(error, callback) {
        if (error && error.data) {
          return callback(error.data);
        }
      }

  function fetchUser(callback) {
        userAPI.currentUser().then(function(response) {
          var user = Restangular.stripRestangular(response.data);
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
          session.setLogin();
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
});
