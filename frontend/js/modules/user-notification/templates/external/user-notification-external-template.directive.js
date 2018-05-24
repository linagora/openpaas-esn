(function() {
  'use strict';

  angular.module('esn.user-notification')
    .directive('esnUserNotificationExternal', esnUserNotificationExternal);

  function esnUserNotificationExternal(
    $q,
    objectTypeResolver
  ) {
    return {
      controller: controller,
      restrict: 'E',
      replace: true,
      scope: {
        notification: '='
      },
      templateUrl: '/views/modules/user-notification/templates/external/user-notification-external-template.html'
    };

    function controller($scope) {
      var acknowledging = false;

      $scope.acknowledge = function() {
        if (acknowledging) {
          return;
        }
        acknowledging = true;
        $scope.notification.setAcknowledged(true).catch(function(error) {
          $scope.error = error;
        });
      };

      var resolvers = {};

      resolvers.subject = objectTypeResolver.resolve($scope.notification.subject.objectType, $scope.notification.subject.id);
      if ($scope.notification.complement) {
        resolvers.complement = objectTypeResolver.resolve($scope.notification.complement.objectType, $scope.notification.complement.id);
      }

      if ($scope.notification.context) {
        resolvers.context = objectTypeResolver.resolve($scope.notification.context.objectType, $scope.notification.context.id);
      }

      this.actionDone = function(action) {
        $scope.actionDone = action;
      };

      $scope.error = false;

      $q.all(resolvers).then(function(result) {
        if (result.subject && result.subject.data) {
          $scope.subject = {
            url: result.subject.data.url(result.subject.data),
            avatarUrl: result.subject.data.avatarUrl(result.subject.data),
            displayName: result.subject.data.displayName(result.subject.data)
          };
        } else {
          $scope.subject = result.subject;
        }

        if (result.context && result.context.data) {
          $scope.context = {
            url: result.context.data.url(result.context.data),
            avatarUrl: result.context.data.avatarUrl(result.context.data),
            displayName: result.context.data.displayName(result.context.data)
          };
        } else {
          $scope.context = result.context;
        }

        $scope.verb = $scope.notification.verb.text;

        if (result.complement && result.complement.data) {
          $scope.complement = {
            url: result.complement.data.url(result.complement.data),
            avatarUrl: result.complement.data.avatarUrl(result.complement.data),
            displayName: result.complement.data.displayName(result.complement.data)
          };
        } else {
          $scope.complement = result.complement;
        }
      }, function() {
        $scope.error = true;
      }).finally(function() {
        $scope.loading = false;
      });
    }
  }
})();
