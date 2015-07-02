'use strict';

angular.module('esn.project')

.directive('projectCreate',
function(WidgetWizard, selectionService, projectCreationService, $timeout, $location, $alert, $rootScope) {
  function link($scope, element, attrs) {
    $scope.wizard = new WidgetWizard([
      '/project/views/project-creation-wizard-1',
      '/project/views/project-creation-wizard-2',
      '/project/views/project-creation-wizard-3'
      ]);
      selectionService.clear();

      $rootScope.$on('modal.show', function() {
        element.find('#title').focus();
      });

      $scope.project = {
        domain_ids: [$scope.domain._id],
        type: 'open'
      };

      $scope.createProject = function() {
        $scope.wizard.nextStep();
        $scope.project.avatar = {
          exists: function() { return selectionService.getImage() ? true : false; },
          getBlob: function(mime, callback) { return selectionService.getBlob(mime, callback); }
        };
        $scope.create =  { step: 'post', percent: 1 };
        projectCreationService($scope.project)
        .then(onSuccess, onFailure, onNotification);
      };

      $scope.displayError = function(err, parentErr) {
        $timeout(function() {
          $scope.alert = $alert({
            content: err + ' (' + parentErr + ')',
            type: 'danger',
            show: true,
            position: 'bottom',
            container: element.find('p.error')
          });
        },100);
      };

      function onSuccess(id) {
        selectionService.clear();
        if (!$scope.uploadFailed) {
          $scope.create = { step: 'redirect', percent: 100 };
        }
        $scope.$emit('collaboration:join', {collaboration: {id: id, objectType: 'project'}});
        $timeout(function() {
          if ($scope.createModal) {
            $scope.createModal.hide();
          }
          $location.path('/project/' + id);
        }, 1000);
      }

      function onNotification(notif) {
        if (notif.uploadFailed) {
          $scope.uploadFailed = true;
        } else {
          $scope.create = notif;
        }
      }

      function onFailure(err) {
        return $scope.displayError('Error while creating the project', err);
      }
    }

    return {
      restrict: 'E',
      templateUrl: '/project/views/project-create.html',
      scope: {
        user: '=',
        domain: '=',
        createModal: '='
      },
      link: link
    };
})
.directive('ensureUniqueProjectTitle', function(projectAPI, $q) {
  return {
    require: 'ngModel',
    link: function($scope, element, attrs, ngModel) {
      ngModel.$asyncValidators.unique = function(title) {
        return projectAPI.list(attrs.domainId, {title: title}).then(
          function(response) {
            if (response.data.length === 0) {
              return $q.when(true);
            }
            return $q.reject(new Error('Title already taken'));
          },
          function(err) {
            return $q.reject(err);
          }
        );
      };
    }
  };
})
  .directive('projectAddCommunitiesWidget', function($q, projectAPI, notificationFactory) {
      return {
        restrict: 'E',
        replace: true,
        scope: {
          project: '='
        },
        templateUrl: '/project/views/project-add-community-widget.html',
        link: function($scope) {
          $scope.placeholder = 'Enter community name';
          $scope.displayProperty = 'displayName';
          $scope.running = false;
          $scope.members = [];

          function showSuccess() {
            notificationFactory.weakInfo('Members update', 'Communities have been added');
          }

          $scope.getInvitableCommunities = function(query) {
            $scope.query = query;

            var options = {
              domain_id: $scope.project.domain_ids[0],
              search: query
            };
            return projectAPI.getInvitableMembers($scope.project._id, options).then(function(response) {
              response.data.forEach(function(member) {
                member.displayName = member.target.title;
              });
              return response;
            });
          };

          $scope.addMembers = function() {
            if (!$scope.members || $scope.members.length === 0) {
              return;
            }
            if ($scope.running) {
              return;
            }

            $scope.running = true;

            var promises = [];
            $scope.members.forEach(function(member) {
              promises.push(projectAPI.addMember($scope.project._id, {id: member.id, objectType: member.objectType}));
            });

            $q.all(promises).then(
              function() {
                $scope.members = [];
                $scope.running = false;
                showSuccess();
              },
              function() {
                $scope.members = [];
                $scope.error = true;
                $scope.running = false;
              }
            );
          };
        }
      };
    })
  .directive('projectDescription', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        project: '='
      },
      templateUrl: '/project/views/project-description.html'
    };
  })
  .directive('projectDisplay', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/project/views/project-display.html'
    };
  })
  .directive('listProjectActivityStreams', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/project/views/list-project-activity-streams.html'
    };
  })
  .directive('projectCreateButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/project/views/project-create-button.html'
    };
  });
