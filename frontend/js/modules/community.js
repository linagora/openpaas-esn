'use strict';

angular.module('esn.community', ['esn.session', 'esn.image', 'restangular', 'mgcrea.ngStrap.alert', 'mgcrea.ngStrap.modal', 'angularFileUpload'])
  .factory('communityAPI', ['Restangular', '$http', '$upload', function(Restangular, $http, $upload) {

    function list(domain) {
      return Restangular.all('communities').getList({domain_id: domain});
    }

    function get(id) {
      return Restangular.one('communities', id).get();
    }

    function del(id) {
      return Restangular.one('communities', id).remove();
    }

    function create(body) {
      return Restangular.all('communities').post(body);
    }

    function uploadAvatar(id, blob, mime) {
      return $upload.http({
        method: 'POST',
        url: '/api/communities/' + id + '/avatar',
        headers: {'Content-Type': mime},
        data: blob,
        params: {mimetype: mime, size: blob.size},
        withCredentials: true
      });
    }

    return {
      list: list,
      get: get,
      del: del,
      create: create,
      uploadAvatar: uploadAvatar
    };
  }])
  .controller('communityCreateController', ['$scope', '$location', '$timeout', '$log', '$modal', '$alert', 'session', 'communityAPI', 'imageCacheService', '$upload', function($scope, $location, $timeout, $log, $modal, $alert, session, communityAPI, imageCacheService, $upload) {
    imageCacheService.clear();
    $scope.step = 0;
    $scope.sending = false;
    $scope.community = {
      domain_ids: [session.domain._id],
      image: ''
    };
    $scope.alert = undefined;
    $scope.percent = 0;
    $scope.create = {
      step: 'none',
      created: false
    };

    var createModal = $modal({scope: $scope, template: '/views/modules/community/community-create-modal', show: false});
    $scope.showCreateModal = function() {
      createModal.$promise.then(createModal.show);
    };

    $scope.validateTitle = function() {
      return ($scope.community.title && $scope.community.title.length > 0);
    };

    $scope.displayError = function(err) {
      $scope.alert = $alert({
        content: err,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '#communityerror'
      });
    };

    $scope.create = function(community) {
      $scope.create.step = 'post';
      $scope.sending = true;
      $scope.percent = 1;

      if ($scope.alert) {
        $scope.alert.hide();
      }

      if (!community) {
        $log.error('Missing community');
        return $scope.displayError('Community information is missing');
      }

      if (!community.title) {
        $log.error('Missing community title');
        return $scope.displayError('Community title is missing');
      }

      if (!community.domain_ids || community.domain_ids.length === 0) {
        $log.error('Missing community domain');
        return $scope.displayError('Domain is missing, try reloading the page');
      }

      $scope.percent = 5;

      communityAPI.create(community).then(
        function(data) {

          $scope.create.created = true;

          if (community.image && imageCacheService.getImage()) {
            $scope.create.step = 'upload';
            $scope.percent = 20;

            var img = imageCacheService.getImage();
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);

            var mime = 'image/png';
            canvas.toBlob(function(blob) {

              communityAPI.uploadAvatar(data.data._id, blob, mime)
                .progress(function(evt) {
                  var value = parseInt(80.0 * evt.loaded / evt.total);
                  $scope.percent = 20 + value;

                }).success(function() {
                  $scope.percent = 100;
                  $scope.create.step = 'redirect';

                  if (createModal) {
                    createModal.hide();
                  }
                  $location.path('/communities/' + data.data._id);

                }).error(function(error) {
                  $scope.percent = 100;
                  $scope.create.step = 'uploadfailed';
                  $scope.create.error = error;

                  if (createModal) {
                    createModal.hide();
                  }
                  $location.path('/communities/' + data.data._id);

                });
            }, mime);

          } else {
            $scope.percent = 100;
            $scope.create.step = 'redirect';
            if (createModal) {
              createModal.hide();
            }
            $location.path('/communities/' + data.data._id);
          }
        },
        function(err) {
          $scope.sending = false;
          $scope.create.error = err;
          $scope.create.step = 'none';
          $log.error('Error ', err);
          return $scope.displayError('Error while creating the community');
        }
      );
    };
  }])
  .controller('communitiesController', ['$scope', '$log', 'session', 'communityAPI', function($scope, $log, session, communityAPI) {
    $scope.communities = [];
    $scope.error = false;
    $scope.loading = false;
    $scope.selected = '';

    $scope.getAll = function() {
      $scope.selected = 'all';
      $scope.loading = true;
      communityAPI.list(session.domain._id).then(
        function(response) {
          $scope.communities = response.data;
        },
        function(err) {
          $log.error('Error while getting communities', err);
          $scope.error = true;
        }
      ).finally (
        function() {
          $scope.loading = false;
        }
      );
    };

    $scope.getMembership = function() {
      $scope.selected = 'membership';
      $scope.loading = false;
      $scope.error = false;
      $scope.communities = [];
    };

    $scope.getModerator = function() {
      $scope.selected = 'moderator';
      $scope.loading = false;
      $scope.error = false;
      $scope.communities = [];
    };

    $scope.getAll();
  }])
  .directive('communityDisplay', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/community/community-display.html'
    };
  });
