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
  .directive('appstoreSwitchDeploy', ['$log', '$q', '$timeout', 'session', 'appstoreAPI', 'applicationService', 'disableService', function($log, $q, $timeout, session, appstoreAPI, applicationService, disableService) {
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
            }, function(error) {
              $log.debug('Application deployment failed at domain level.', error);
            });
        }

        function deploy() {
          return appstoreAPI.deploy(scope.application._id, target, scope.version)
            .then(function() {
              $log.debug('Application deployment success.');
            }, function(error) {
              $log.debug('Application deployment failed.', error);
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
            }, function(error) {
              $log.debug('Application undeployment failed.', error);
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
  .directive('appstoreSwitchInstall', ['$log', '$q', '$timeout', 'session', 'appstoreAPI', 'applicationService', 'disableService', function($log, $q, $timeout, session, appstoreAPI, applicationService, disableService) {
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
            }, function(error) {
              $log.debug('Application install failed.', error);
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
            }, function(error) {
              $log.debug('Application uninstall failed.', error);
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
  .directive('appstoreButtonDeploy', ['$log', '$q', 'session', 'appstoreAPI', 'applicationService', 'disableService', function($log, $q, session, appstoreAPI, applicationService, disableService) {
    return {
      require: '^appstoreButtonsGroup',
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-deploy.html',
      scope: {
        application: '=',
        version: '@',
        domainDeployment: '='
      },
      link: function(scope, element, attrs, controllers) {
        var target = { objectType: 'domain', id: session.domain._id };
        scope.domainDeployment = applicationService.isDomainLevel(scope.application);
        scope.loading = false;
        scope.disabled = disableService(target, scope.application.deployments);

        function deployAndInstall() {
          return appstoreAPI.deploy(scope.application._id, target, scope.version)
            .then(function() {
              return appstoreAPI.install(scope.application._id, target);
            })
            .then(function() {
              $log.debug('Application deployment success at domain level.');
            }, function(error) {
              $log.debug('Application deployment failed at domain level.', error);
            });
        }

        function deploy() {
          return appstoreAPI.deploy(scope.application._id, target, scope.version)
            .then(function() {
              $log.debug('Application deployment success.');
            }, function(error) {
              $log.debug('Application deployment failed.', error);
            });
        }

        scope.deploy = function() {
          scope.loading = true;
          var steps = scope.domainDeployment ? deployAndInstall : deploy;
          steps()
            .finally (function() {
              scope.loading = false;
              scope.disabled = true;
              controllers.emit('deployed');
              $log.debug('Done.');
            });
        };

        scope.$on('undeployed', function() {
          scope.disabled = false;
        });
      }
    };
  }])
  .directive('appstoreButtonUndeploy', ['$log', 'session', 'appstoreAPI', 'disableService', function($log, session, appstoreAPI, disableService) {
    return {
      require: '^appstoreButtonsGroup',
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-undeploy.html',
      scope: {
        application: '=',
        target: '='
      },
      link: function(scope, element, attrs, controllers) {
        var target = { objectType: 'domain', id: session.domain._id };
        scope.loading = false;
        scope.disabled = !disableService(target, scope.application.deployments);

        scope.undeploy = function() {
          scope.loading = true;
          appstoreAPI.undeploy(scope.application._id, target)
            .then(function() {
              $log.debug('Application undeployment success.');
            }, function(error) {
              $log.debug('Application undeployment failed.', error);
            }).finally (function() {
              scope.loading = false;
              scope.disabled = true;
              controllers.emit('undeployed');
              $log.debug('Done.');
            });
        };

        scope.$on('deployed', function() {
          scope.disabled = false;
        });
      }
    };
  }])
  .directive('appstoreButtonInstall', ['$log', 'session', 'appstoreAPI', 'disableService', function($log, session, appstoreAPI, disableService) {
    return {
      require: '^appstoreButtonsGroup',
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-install.html',
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

        if (deployment[0]) {
          scope.disabled = disableService(target, deployment[0].installs);
        } else {
          scope.disabled = true;
        }

        scope.loading = false;
        scope.install = function() {
          scope.loading = true;
          appstoreAPI.install(scope.application._id, target)
            .then(function() {
              $log.debug('Application install success.');
            }, function(error) {
              $log.debug('Application install failed.', error);
            }).finally (function() {
              scope.loading = false;
              scope.disabled = true;
              controllers.emit('installed');
              $log.debug('Done.');
            });
        };

        scope.$on('uninstalled', function() {
          scope.disabled = false;
        });
      }
    };
  }])
  .directive('appstoreButtonUninstall', ['$log', 'session', 'appstoreAPI', 'disableService', function($log, session, appstoreAPI, disableService) {
    return {
      require: '^appstoreButtonsGroup',
      restrict: 'E',
      templateUrl: '/appstore/views/appstore/appstore-button-uninstall.html',
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
        if (deployment[0]) {
          scope.disabled = !disableService(target, deployment[0].installs);
        } else {
          scope.disabled = true;
        }
        scope.loading = false;

        scope.uninstall = function() {
          scope.loading = true;
          appstoreAPI.uninstall(scope.application._id, target)
            .then(function() {
              $log.debug('Application uninstall success.');
            }, function(error) {
              $log.debug('Application uninstall failed.', error);
            }).finally (function() {
              scope.loading = false;
              scope.disabled = true;
              controllers.emit('uninstalled');
              $log.debug('Done.');
            });
        };

        scope.$on('installed', function() {
          scope.disabled = false;
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
  .directive('appstoreButtonsGroup', function() {
    return {
      restrict: 'A',
      controller: function($scope) {
        this.emit = function(event) {
          $scope.$broadcast(event);
        };
      }
    };
  })
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
