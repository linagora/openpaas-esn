'use strict';

angular.module('esn.appstore')
  .directive('appstoreButtonSubmit', ['$modal', function($modal) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-submit.html',
      link: function($scope) {
        $scope.$on('modal.hide', function(evt, modal) {
          $scope.createModal = null;
          modal.destroy();
        });
        $scope.showSubmitModal = function() {
          $scope.submitModal = $modal({scope: $scope, template: '/appstore/views/appstore/appstore-app-submit-modal'});
        };
      }
    };
  }])
  .directive('ensureUniqueApplicationTitle', ['appstoreAPI', 'session', '$timeout', function(appstoreAPI, session, $timeout) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, elem , attrs, control) {
        var lastValue = null;
        var timer = null;

        var checkNameValidity = function() {
          control.$setValidity('ajax', false);
          (function(title) {
            appstoreAPI.list({title: title}).then(
              function(response) {
                if (lastValue !== title) {
                  return;
                }

                if (response.data.length !== 0) {
                  control.$setValidity('ajax', true);
                  control.$setValidity('unique', false);
                }
                else {
                  control.$setValidity('ajax', true);
                  control.$setValidity('unique', true);
                }
              },
              function() {
                if (lastValue !== title) {
                  return;
                }
                control.$setValidity('ajax', true);
                control.$setValidity('unique', true);
              }
            );
          })(lastValue);
        };

        control.$viewChangeListeners.push(function() {
          var applicationTitle = control.$viewValue;
          if (applicationTitle === lastValue) {
            return;
          }
          lastValue = applicationTitle;

          control.$setValidity('unique', true);
          if (timer) {
            $timeout.cancel(timer);
          }

          if (applicationTitle.length === 0) {
            control.$setValidity('ajax', true);
            return;
          }

          control.$setValidity('ajax', false);
          timer = $timeout(checkNameValidity, 1000);
        });
      }
    };
  }])
  .directive('appstoreButtonDeploy', ['appstoreAPI', function(appstoreAPI) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-deploy.html',
      scope: {
        disabled: '=',
        application: '=',
        commmunity: '='
      }
    };
  }])
  .directive('appstoreButtonUndeploy', ['appstoreAPI', function(appstoreAPI) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-undeploy.html',
      scope: {
        application: '=',
        commmunity: '='
      }
    };
  }])
  .directive('appstoreButtonInstall', ['appstoreAPI', function(appstoreAPI) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-install.html',
      scope: {
        disabled: '&',
        install: '&'
      }
    };
  }])
  .directive('appstoreButtonUpdate', ['appstoreAPI', function(appstoreAPI) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-update.html',
      scope: {
        disabled: '&',
        update: '&'
      }
    };
  }])
  .directive('appstoreButtonUninstall', ['appstoreAPI', function(appstoreAPI) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-uninstall.html',
      scope: {
        disabled: '&',
        uninstall: '&'
      }
    };
  }])
  .directive('appstoreAppDisplay', function() {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-app-display.html',
      scope: {
        application: '='
      }
    };
  })
  .directive('appstoreAppDetails', function() {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-app-details.html',
      scope: {
        application: '='
      }
    };
  })
  .directive('communityAppDisplay', ['communityAppstoreAPI', '$log', function(communityAppstoreAPI, $log) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/community/community-app-display.html',
      scope: {
        application: '=',
        community: '='
      },
      link: function($scope) {

        $scope.load = false;

        $scope.canBeUpdated = function() {
          return $scope.application.update;
        };

        $scope.canBeUninstalled = function() {
          return $scope.application.installed;
        };

        $scope.isInstalled = function() {
          return $scope.application.installed;
        };

        $scope.updateApplication = function() {
          $scope.load = true;
          var version = {
          };
          communityAppstoreAPI.update($scope.community._id, $scope.application._id, version).then(
            function() {
              $log.debug('Application updated');
              $scope.application.update = false;
            },
            function(err) {
              $log.error('Application update error', err.data);
            }
          ).finally (function() {
              $scope.load = false;
            }
          );
        };

        $scope.uninstallApplication = function() {
          $scope.load = true;
          communityAppstoreAPI.uninstall($scope.community._id, $scope.application).then(
            function() {
              $log.debug('Application uninstalled');
              $scope.application.installed = false;
            },
            function(err) {
              $log.error('Application uninstall error', err.data);
            }
          ).finally (function() {
              $scope.load = false;
            }
          );
        };

        $scope.installApplication = function() {
          $scope.load = true;
          communityAppstoreAPI.install($scope.community._id, $scope.application).then(
            function() {
              $log.debug('Application installed');
              $scope.application.installed = true;
            },
            function(err) {
              $log.error('Application install error', err.data);
            }
          ).finally (function() {
              $scope.load = false;
            }
          );
        };
      }
    };
  }]);
