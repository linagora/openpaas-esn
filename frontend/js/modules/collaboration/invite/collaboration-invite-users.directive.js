(function() {
  'use strict';

  angular.module('esn.collaboration')
    .directive('esnCollaborationInviteUsers', esnCollaborationInviteUsers);

  function esnCollaborationInviteUsers($q, notificationFactory, session, esnCollaborationService, esnCollaborationClientService) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        objectType: '@',
        collaboration: '='
      },
      templateUrl: '/views/modules/collaboration/invite/collaboration-invite-users.html',
      link: link
    };

    function link($scope, $element) {
      $scope.placeholder = 'User name';
      $scope.displayProperty = 'displayName';
      $scope.running = false;

      $scope.getErrorDiv = function() {
        return $element.find('[error-container]');
      };

      $scope.getRunningDiv = function() {
        return $element.children('.form-container').children('form').find('[running-container]');
      };

      $scope.getButtonContent = function() {
        return $element.children('.form-container').children('form').find('[button-content]');
      };

      $scope.showErrorMessage = function() {
        $scope.getErrorDiv().removeClass('hidden');
      };

      $scope.hideErrorMessage = function() {
        $scope.getErrorDiv().addClass('hidden');
      };

      $scope.showRunning = function() {
        $scope.getRunningDiv().removeClass('hidden');
        $scope.getButtonContent().addClass('hidden');
      };

      $scope.hideRunning = function() {
        $scope.getRunningDiv().addClass('hidden');
        $scope.getButtonContent().removeClass('hidden');
      };

      $scope.showSuccessMessage = function() {
        notificationFactory.weakInfo('Invitations have been sent', 'You will be notified when new users join the collaboration.');
      };

      $scope.resetMessages = function() {
        $scope.hideErrorMessage();
      };

      $scope.getInvitablePeople = function(query) {
        $scope.query = query;
        var deferred = $q.defer();

        esnCollaborationClientService.getInvitablePeople($scope.objectType, $scope.collaboration._id, {search: query, limit: 5}).then(
          function(response) {
            var cache = Object.create(null);

            response.data.forEach(function(user) {
              if (user.firstname && user.lastname) {
                user.displayName = user.firstname + ' ' + user.lastname;
              } else {
                user.displayName = user.emails[0];
              }

              if ((user.displayName in cache) && user.displayName !== user.emails[0]) {
                user.displayName += ' - ' + user.emails[0];
              }
              cache[user.displayName] = true;

              $scope.query = '';
            });
            deferred.resolve(response);
          },
          function(error) {
            deferred.resolve(error);
          }
        );

        return deferred.promise;
      };

      $scope.inviteUsers = function() {
        $scope.hideErrorMessage();
        $scope.noUser = false;
        $scope.invalidUser = false;
        if ($scope.query && $scope.query !== '') {
          $scope.invalidUser = $scope.query;
          $scope.showErrorMessage();
          if (!$scope.users || $scope.users.length === 0) {
            $scope.query = '';

            return;
          }
        } else if (!$scope.users || $scope.users.length === 0) {
          $scope.noUser = true;
          $scope.showErrorMessage();

          return;
        }

        if ($scope.running) {
          return;
        }

        $scope.resetMessages();
        $scope.running = true;
        $scope.showRunning();

        var promises = $scope.users.map(function(user) {
          return esnCollaborationClientService.requestMembership($scope.objectType, $scope.collaboration._id, user._id);
        });

        $q.all(promises).then(
          function() {
            $scope.users = [];
            $scope.running = false;
            $scope.hideRunning();
            $scope.showSuccessMessage();
            if ($scope.query && $scope.query !== '') {
              $scope.invalidUser = $scope.query;
              $scope.showErrorMessage();
            }
          },
          function(error) {
            $scope.users = [];
            $scope.error = error.data;
            $scope.running = false;
            $scope.hideRunning();
            $scope.showErrorMessage();
          }
        );
      };

      if (esnCollaborationService.isManager($scope.collaboration, session.user)) {
        $element.removeClass('hidden');
      }
    }
  }
})();
