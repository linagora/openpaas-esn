'use strict';

angular.module('esn.appstore')
  .controller('appstoreController', function($scope, appstoreAPI) {
    $scope.loading = false;
    $scope.error = false;

    $scope.loadApplications = function() {
      $scope.loading = true;
      appstoreAPI.list().then(function(response) {
        $scope.applications = response.data;
      }, function(err) {
        $scope.error = true;
      }).finally (function() {
        $scope.loading = false;
      });
    };

    $scope.loadApplications();
  })
  .controller('appstoreAppController', function($scope, appstoreAPI, application) {
    $scope.application = application;
  })
  .controller('appstoreAppSubmitController', function($rootScope, $scope, $q, $location, $timeout, $log, $alert, session, appstoreAPI, $upload, selectionService) {
      selectionService.clear();

      var initScope = function() {
        $scope.step = 0;
        $scope.sending = false;
        $scope.validationError = {};
        $scope.application = {
          avatar: '',
          artifact: ''
        };

        $scope.alert = undefined;
        $scope.percent = 0;
        $scope.createStatus = {
          step: 'none',
          created: false
        };
        $scope.artifactselected = false;
      };

      initScope();

      $scope.isTitleEmpty = function() {
        return !$scope.application.title;
      };

      $scope.onInputChange = function() {
        $scope.validationError = {};
      };

      $scope.isTitleInvalid = function() {
        return $scope.applicationForm.title.$error.unique || $scope.validationError.unique;
      };

      $scope.onFileSelect = function($files) {
        if ($files && $files[0]) {
          $scope.artifact = $files[0];
        }
      };

      $scope.titleValidationRunning = false;
      $scope.validateStep0 = function() {
        if ($scope.titleValidationRunning) {
          return;
        }
        $scope.titleValidationRunning = true;

        appstoreAPI.list({title: $scope.application.title}).then(
          function(response) {
            if (response.data.length === 0) {
              $scope.step = 1;
            }
            else {
              $scope.validationError.unique = true;
            }
            $scope.titleValidationRunning = false;
          },
          function(err) {
            $scope.validationError.ajax = true;
            $log.error(err);
            $scope.titleValidationRunning = false;
          }
        );
      };

      $scope.backToStep0 = function() {
        $scope.step = 0;
      };

      $scope.displayError = function(err) {
        $scope.alert = $alert({
          content: err,
          type: 'danger',
          show: true,
          position: 'bottom',
          container: '#applicationerror'
        });
      };

      $scope.submit = function(application) {
        $scope.createStatus.step = 'post';
        $scope.sending = true;
        $scope.percent = 1;

        if ($scope.alert) {
          $scope.alert.hide();
        }

        if (!application) {
          $log.error('Missing application');
          return $scope.displayError('application information is missing');
        }

        if (!application.title) {
          $log.error('Missing application title');
          return $scope.displayError('application title is missing');
        }

        if (!$scope.artifact) {
          $log.error('Missing application artifact');
          return $scope.displayError('application artifact is missing');
        }

        $scope.percent = 5;

        function done(id) {
          $timeout(function() {
            if ($scope.submitModal) {
              $scope.submitModal.hide();
            }
            selectionService.clear();
            $location.path('/appstore/apps/' + id);
          }, 1000);
        }

        function uploadAvatar(id) {
          var defer = $q.defer();

          if (selectionService.getImage()) {
            $scope.createStatus.step = 'upload';
            var mime = 'image/png';
            selectionService.getBlob(mime, function(blob) {
              appstoreAPI.uploadAvatar(id, blob, mime)
                .success(function(data) {
                  $log.debug('avatar uploaded');
                }).error(function(error) {
                  $log.debug('avatar upload error', error);
                }).finally (function() {
                defer.resolve();
              });
            });
          } else {
            defer.resolve();
          }
          return defer.promise;
        }

        function uploadArtifact(id) {
          var defer = $q.defer();

          if (!$scope.artifact) {
            defer.reject();
          }

          // TODO hack version because we do not have
          // any way to deploy a specific version right now.
          appstoreAPI.uploadArtifact(id, $scope.artifact, '1.0.0')
            .progress(function(evt) {
              var value = parseInt(80.0 * evt.loaded / evt.total);
              $scope.percent = 20 + value;

            }).success(function() {
              $log.debug('artifact uploaded');
            }).error(function(error) {
              $log.debug('artifact upload error', error);
            }).finally (function() {
              $scope.percent = 100;
              defer.resolve();
            }
          );
          return defer.promise;
        }

        appstoreAPI.create(application).then(
          function(data) {
            $scope.createStatus.created = true;
            $q.all([uploadAvatar(data.data._id), uploadArtifact(data.data._id)]).then(function() {
              $log.debug('Avatar and artifact uploaded');
            }, function(err) {
              $log.debug('Avatar and/or Artifact upload failure', err);
            }).finally (function() {
              return done(data.data._id);
            });
          },
          function(err) {
            $scope.sending = false;
            $scope.createStatus.error = err;
            $scope.createStatus.step = 'none';
            $log.error('Error ', err);
            return $scope.displayError('Error while submitting the application');
          }
        );
      };
    })
  .controller('communityAppstoreController', function($scope, applications, community) {
    $scope.applications = applications;
    $scope.community = community;
  });
