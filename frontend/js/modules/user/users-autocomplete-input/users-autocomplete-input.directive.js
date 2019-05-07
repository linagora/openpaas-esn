(function(angular) {
  'use strict';

  angular.module('esn.user')
    .directive('usersAutocompleteInput', usersAutocompleteInput);

  function usersAutocompleteInput(
    $log,
    _,
    session,
    attendeeService,
    esnI18nService,
    AUTOCOMPLETE_MAX_RESULTS,
    USER_AUTO_COMPLETE_TEMPLATE_URL
  ) {
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

    function link(scope) {
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
                { _id: user.id }, //to be compatible with post processes using domain API response
                { templateUrl: USER_AUTO_COMPLETE_TEMPLATE_URL }
              );
            });
          })
          .catch(function(error) {
            $log.error('Error while searching users:', error);

            return [];
          });
      };

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
    }
  }
})(angular);
