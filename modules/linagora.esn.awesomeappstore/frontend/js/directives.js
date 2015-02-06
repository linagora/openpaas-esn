'use strict';

angular.module('esn.appstore')
  .constant('NOTIFICATION', {
    title: 'Module Manager',
    success: {
      deployment: function(title) { return title + ' has successfully been deployed.'; },
      deploymentAndInstall: function(title) { return title + ' has successfully been deployed and installed.';},
      undeployment: function(title) { return title + ' has successfully been undeployed.'; },
      install: function(title) { return title + ' has successfully been installed'; },
      uninstall: function(title) { return title + ' has successfully been uninstalled'; }
    },
    error: {
      deployment: function(title, message) { return 'Failed to deploy ' + title + ' : ' + message; },
      deploymentAndInstall: function(title, message) { return 'Failed to deploy and install ' + title + ' : ' + message; },
      undeployment: function(title, message) { return 'Failed to undeploy ' + title + ' : ' + message; },
      install: function(title, message) { return 'Failed to install ' + title + ' : ' + message; },
      uninstall: function(title, message) { return 'Failed to uninstall ' + title + ' : ' + message; }
    }
  })
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
  .directive('ensureUniqueApplicationTitle', ['$timeout', '$q', 'appstoreAPI', function($timeout, $q, appstoreAPI) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, elem , attrs, ngModel) {
        ngModel.$asyncValidators.unique = function(title) {
          return appstoreAPI.list({title: title}).then(
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
  }])
  .directive('appstoreLabelDomainDeploy', ['$log', 'applicationService', function($log, applicationService) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-label-domain-deploy.html',
      scope: {
        application: '='
      },
      link: function(scope) {
        scope.domainLevelApplication = applicationService.isDomainLevel(scope.application);
        $log.info(scope.domainLevelApplication);
      }
    };
  }])
  .directive('appstoreSwitchDeploy', ['$log', '$q', '$timeout', 'session', 'appstoreAPI', 'applicationService', 'disableService', 'notificationFactory', 'NOTIFICATION', function($log, $q, $timeout, session, appstoreAPI, applicationService, disableService, notificationFactory, NOTIFICATION) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-switch.html',
      scope: {
        application: '=',
        version: '@',
        domainDeployment: '='
      },
      link: function(scope, element, attrs, controllers) {
        var target = { objectType: 'domain', id: session.domain._id };
        scope.domainDeployment = applicationService.isDomainLevel(scope.application);
        scope.loading = false;
        scope.switch = {};
        scope.switch.status = disableService(target, scope.application.deployments);
        scope.active = true;

        function deployAndInstall() {
          return appstoreAPI.deploy(scope.application._id, target, scope.version)
            .then(function() {
              return appstoreAPI.install(scope.application._id, target);
            })
            .then(function() {
              $log.debug('Application deployment success at domain level.');
              notificationFactory.weakSuccess(NOTIFICATION.title, NOTIFICATION.success.deploymentAndInstall(scope.application.title));
            }, function(error) {
              $log.debug('Application deployment failed at domain level.', error);
              notificationFactory.weakError(NOTIFICATION.title, NOTIFICATION.error.deploymentAndInstall(scope.application.title, error.data.error.details));
            });
        }

        function deploy() {
          return appstoreAPI.deploy(scope.application._id, target, scope.version)
            .then(function() {
              $log.debug('Application deployment success.');
              notificationFactory.weakSuccess(NOTIFICATION.title, NOTIFICATION.success.deployment(scope.application.title));
            }, function(error) {
              $log.debug('Application deployment failed.', error);
              notificationFactory.weakError(NOTIFICATION.title, NOTIFICATION.error.deployment(scope.application.title, error.data.error.details));
            });
        }

        scope.deploy = function() {
          scope.loading = true;
          var steps = scope.domainDeployment ? deployAndInstall : deploy;
          steps()
            .finally (function() {
            scope.loading = false;
            $log.debug('Done.');
          });
        };

        scope.undeploy = function() {
          scope.loading = true;
          appstoreAPI.undeploy(scope.application._id, target)
            .then(function() {
              $log.debug('Application undeployment success.');
              notificationFactory.weakSuccess(NOTIFICATION.title, NOTIFICATION.success.undeployment(scope.application.title));
            }, function(error) {
              $log.debug('Application undeployment failed.', error);
              notificationFactory.weakError(NOTIFICATION.title, NOTIFICATION.error.undeployment(scope.application.title, error.data.error.details));
            }).finally (function() {
            scope.loading = false;
            $log.debug('Done.');
          });
        };

        var initializing = true;
        scope.$watch('switch.status', function(value) {
          if (initializing) {
            $timeout(function() {
              initializing = false;
            });
          } else {
            value ? scope.deploy() : scope.undeploy();
          }
        });
      }
    };
  }])
  .directive('appstoreSwitchInstall', ['$log', '$q', '$timeout', 'session', 'appstoreAPI', 'applicationService', 'disableService', 'notificationFactory', 'NOTIFICATION', function($log, $q, $timeout, session, appstoreAPI, applicationService, disableService, notificationFactory, NOTIFICATION) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-switch.html',
      scope: {
        application: '=',
        community: '='
      },
      link: function(scope, element, attrs, controllers) {
        var target = { objectType: 'community', id: scope.community._id };
        var targetDomain = { objectType: 'domain', id: session.domain._id };
        var deployment = scope.application.deployments.filter(function(deployment) {
          return angular.equals(deployment.target, targetDomain);
        });
        scope.loading = false;
        scope.switch = {};
        scope.switch.status = disableService(target, scope.application.deployments);

        if (deployment[0]) {
          scope.deploySwitch = disableService(target, deployment[0].installs);
        } else {
          scope.active = false;
        }

        scope.loading = false;
        scope.install = function() {
          scope.loading = true;
          appstoreAPI.install(scope.application._id, target)
            .then(function() {
              $log.debug('Application install success.');
              notificationFactory.weakSuccess(NOTIFICATION.title, NOTIFICATION.success.install(scope.application.title));
            }, function(error) {
              $log.debug('Application install failed.', error);
              notificationFactory.weakError(NOTIFICATION.title, NOTIFICATION.error.install(scope.application.title, error.data.error.details));
            }).finally (function() {
            scope.loading = false;
            $log.debug('Done.');
          });
        };

        scope.uninstall = function() {
          scope.loading = true;
          appstoreAPI.uninstall(scope.application._id, target)
            .then(function() {
              $log.debug('Application uninstall success.');
              notificationFactory.weakSuccess(NOTIFICATION.title, NOTIFICATION.success.uninstall(scope.application.title));
            }, function(error) {
              $log.debug('Application uninstall failed.', error);
              notificationFactory.weakError(NOTIFICATION.title, NOTIFICATION.error.uninstall(scope.application.title, error.data.error.details));
            }).finally (function() {
            scope.loading = false;
            $log.debug('Done.');
          });
        };

        var initializing = true;
        scope.$watch('switch.status', function(value) {
          if (initializing) {
            $timeout(function() {
              initializing = false;
            });
          } else {
            value ? scope.install() : scope.uninstall();
          }
        });
      }
    };
  }])
  .directive('appstoreButtonUpdate', ['appstoreAPI', function(appstoreAPI) {
    return {
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-update.html',
      scope: {
        application: '=',
        community: '='
      },
      controller: function($scope) {
        $scope.update = function() {};

        $scope.disabled = function() {
          return true;
        };

      }
    };
  }])
  .directive('appstoreAppDisplay', function() {
    return {
      replace: true,
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
