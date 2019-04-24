'use strict';

angular.module('esn.user', ['esn.http', 'esn.object-type', 'esn.lodash-wrapper', 'esn.session', 'esn.attendee'])
  .run(function(objectTypeResolver, userAPI, userUtils, esnRestangular) {
    objectTypeResolver.register('user', userAPI.user);
    esnRestangular.extendModel('users', function(model) {
      model.url = function(user) {
        return '/#/profile/' + user._id || user;
      };
      model.avatarUrl = function(user) {
        return '/api/avatars?objectType=user&email=' + user.emails[0] || user;
      };
      model.displayName = function(user) {
        return userUtils.displayNameOf(user);
      };
      model.__id = function(user) {
        return user._id || user;
      };

      return model;
    });
  })
  .factory('userAPI', function(esnRestangular, session) {

    function currentUser() {
      return esnRestangular.one('user').get({_: Date.now()});
    }

    function user(uuid) {
      return esnRestangular.one('users', uuid).get();
    }

    function getUsersByEmail(email) {
      return esnRestangular.all('users').getList({ email: email });
    }

    function getCommunities() {
      return esnRestangular.one('user').all('communities').getList();
    }

    function getActivityStreams(options) {
      options = options || {};

      return esnRestangular.one('user').all('activitystreams').getList(options);
    }

    function setUserStates(userId, states, domainId) {
      return esnRestangular.one('users', userId).customPUT(states, 'states', { domain_id: domainId || session.domain._id });
    }

    return {
      currentUser: currentUser,
      user: user,
      getCommunities: getCommunities,
      getActivityStreams: getActivityStreams,
      getUsersByEmail: getUsersByEmail,
      setUserStates: setUserStates
    };
  })
  .factory('userUtils', function() {
    function displayNameOf(user) {
      if (!user.firstname && !user.lastname) {
        return user.preferredEmail;
      }

      return (user.firstname && user.lastname) ? user.firstname + ' ' + user.lastname : (user.firstname || user.lastname);
    }

    return {
      displayNameOf: displayNameOf
    };
  })
  .constant('USER_AUTO_COMPLETE_TEMPLATE_URL', '/views/modules/auto-complete/user-auto-complete.html')
  .directive('usersAutocompleteInput', function($q, _, session, $log, attendeeService, esnI18nService, userUtils, AUTOCOMPLETE_MAX_RESULTS, USER_AUTO_COMPLETE_TEMPLATE_URL) {
    function link(scope) {

      function getUserTuples(users) {
        var tuples = [];

        users.forEach(function(user) {
          if (user.id || user._id) {
            tuples.push({
              id: user.id || user._id,
              objectType: 'user'
            });
          }
        });

        return _.uniq(tuples, 'id');
      }

      scope.translatedPlaceholder = esnI18nService.translate(scope.placeholder || 'Users').toString();

      scope.getUsers = function(query) {
        var excludedUsers = []
          .concat(scope.shouldIncludeSelf ? [] : session.user)
          .concat(scope.mutableUsers)
          .concat(scope.originalUsers || [])
          .concat(scope.ignoredUsers || []);

        return attendeeService.getAttendeeCandidates(query, AUTOCOMPLETE_MAX_RESULTS, ['user'], getUserTuples(excludedUsers))
          .then(function(users) {
            return users.map(function(user) {
              return _.assign(
                user,
                { _id: user.id }, //to be compatible with post processes using domain API reponse
                { templateUrl: USER_AUTO_COMPLETE_TEMPLATE_URL }
              );
            });
          })
          .catch(function(error) {
            $log.error('Error while searching users:', error);

            return [];
          });
      };
    }

    return {
      restrict: 'E',
      templateUrl: '/views/modules/user/users-autocomplete-input.html',
      link: link,
      scope: {
        originalUsers: '=?',
        mutableUsers: '=',
        ignoredUsers: '=?',
        onAddingUser: '=?',
        onUserAdded: '=?',
        onUserRemoved: '=?',
        addFromAutocompleteOnly: '=?',
        propagateEnterEvent: '=?',
        placeholder: '@?',
        shouldIncludeSelf: '@?'
      }
    };
  })
  .factory('usernameService', function(Cache, userAPI, userUtils) {
    var cache = new Cache({
      loader: _userNameLoader
    });

    return {
      getFromId: getFromId
    };

    function _userNameLoader(userId) {
      return userAPI.user(userId).then(function(response) {
        return userUtils.displayNameOf(response.data);
      });
    }

    function getFromId(userId) {
      return cache.get(userId);
    }
  });
