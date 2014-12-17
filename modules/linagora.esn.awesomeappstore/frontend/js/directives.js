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
  .directive('ensureUniqueApplicationTitle', ['$timeout', 'appstoreAPI', function($timeout, appstoreAPI) {
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
  .directive('appstoreButtonDeploy', ['$log', 'session', 'appstoreAPI', function($log, session, appstoreAPI) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-deploy.html',
      scope: {
        application: '=',
        target: '=',
        version: '@'
      },
      controller: function($scope) {
        var target = { objectType: 'domain', id: session.domain._id };
        $scope.loading = false;

        $scope.deploy = function() {
          $scope.loading = true;
          appstoreAPI.deploy($scope.application._id, target, $scope.version)
            .then(function() {
              $log.debug('Application deployment success.');
            }, function(error) {
              $log.debug('Application deployment failed.', error);
            }).finally (function() {
              $scope.loading = false;
              $log.debug('Done.');
            });
        };

        $scope.disabled = function() {
          return false;
        };

      }
    };
  }])
  .directive('appstoreButtonUndeploy', ['$log', 'session', 'appstoreAPI', function($log, session, appstoreAPI) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-undeploy.html',
      scope: {
        application: '=',
        target: '='
      },
      controller: function($scope) {
        var target = { objectType: 'domain', id: session.domain._id };

        $scope.loading = false;
        $scope.undeploy = function() {
          $scope.loading = true;
          appstoreAPI.undeploy($scope.application._id, target)
            .then(function() {
              $log.debug('Application undeployment success.');
            }, function(error) {
              $log.debug('Application undeployment failed.', error);
            }).finally (function() {
              $scope.loading = false;
              $log.debug('Done.');
            });
        };

        $scope.disabled = function() {
          return false;
        };

      }
    };
  }])
  .directive('appstoreButtonInstall', ['$log', 'appstoreAPI', function($log, appstoreAPI) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-install.html',
      scope: {
        application: '=',
        community: '='
      },
      controller: function($scope) {
        var target = { objectType: 'community', id: $scope.community._id };

        $scope.loading = false;
        $scope.install = function() {
          $scope.loading = true;
          appstoreAPI.install($scope.application._id, target)
            .then(function() {
              $log.debug('Application install success.');
            }, function(error) {
              $log.debug('Application install failed.', error);
            }).finally (function() {
              $scope.loading = false;
              $log.debug('Done.');
            });
        };

        $scope.disabled = function() {
          return false;
        };

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
  .directive('appstoreButtonUninstall', ['$log', 'appstoreAPI', function($log, appstoreAPI) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-uninstall.html',
      scope: {
        application: '=',
        community: '='
      },
      controller: function($scope) {
        var target = { objectType: 'community', id: $scope.community._id };

        $scope.loading = false;
        $scope.uninstall = function() {
          $scope.loading = true;
          appstoreAPI.uninstall($scope.application._id, target)
            .then(function() {
              $log.debug('Application uninstall success.');
            }, function(error) {
              $log.debug('Application uninstall failed.', error);
            }).finally (function() {
              $scope.loading = false;
              $log.debug('Done.');
            });
        };

        $scope.disabled = function() {
          return false;
        };

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
  .directive('communityAppDisplay', ['appstoreAPI', '$log', function(appstoreAPI, $log) {
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
          appstoreAPI.update($scope.community._id, $scope.application._id, version).then(
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
          appstoreAPI.uninstall($scope.community._id, $scope.application).then(
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
          appstoreAPI.install($scope.community._id, $scope.application).then(
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
