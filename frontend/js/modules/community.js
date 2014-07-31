'use strict';

angular.module('esn.community', ['esn.session', 'esn.image', 'esn.user', 'esn.avatar', 'restangular', 'mgcrea.ngStrap.alert', 'mgcrea.ngStrap.modal', 'angularFileUpload'])
  .factory('communityAPI', ['Restangular', '$http', '$upload', function(Restangular, $http, $upload) {

    function list(domain, options) {
      var query = options || {};
      query.domain_id = domain;
      return Restangular.all('communities').getList(query);
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

    function getMembers(id) {
      return Restangular.one('communities', id).all('members').getList();
    }

    function getMember(id, member) {
      return Restangular.one('communities', id).one('members', member).get();
    }

    function join(id, member) {
      return Restangular.one('communities', id).one('members', member).put();
    }

    function leave(id, member) {
      return Restangular.one('communities', id).one('members', member).remove();
    }

    return {
      list: list,
      get: get,
      del: del,
      create: create,
      uploadAvatar: uploadAvatar,
      getMembers: getMembers,
      getMember: getMember,
      join: join,
      leave: leave
    };
  }])
  .controller('communityCreateController', ['$rootScope', '$scope', '$location', '$timeout', '$log', '$modal', '$alert', 'session', 'communityAPI', '$upload', 'selectionService', function($rootScope, $scope, $location, $timeout, $log, $modal, $alert, session, communityAPI, $upload, selectionService) {
    selectionService.clear();
    $scope.step = 0;
    $scope.sending = false;
    $scope.community = {
      domain_ids: [session.domain._id],
      image: '',
      type: 'open'
    };
    $scope.alert = undefined;
    $scope.percent = 0;
    $scope.create = {
      step: 'none',
      created: false
    };
    $scope.imageselected = false;

    $rootScope.$on('crop:loaded', function() {
      $scope.imageselected = true;
      $scope.$apply();
    });

    var createModal = $modal({scope: $scope, template: '/views/modules/community/community-create-modal', show: false});
    $scope.showCreateModal = function() {
      createModal.$promise.then(createModal.show);
    };

    $scope.validateTitle = function() {
      if (!$scope.community.title || $scope.community.title.length === 0) {
        return false;
      }
      return true;
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

      if (!community.type) {
        community.type = 'open';
      }

      $scope.percent = 5;

      function done(id) {
        $timeout(function() {
          if (createModal) {
            createModal.hide();
          }
          selectionService.clear();
          $location.path('/communities/' + id);
        }, 1000);
      }

      communityAPI.create(community).then(
        function(data) {

          $scope.create.created = true;

          if (selectionService.getImage()) {
            $scope.create.step = 'upload';
            $scope.percent = 20;

            var image = selectionService.getImage();
            var ratio = selectionService.selection.ratio || 1;
            var selection = selectionService.selection.cords;
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');

            if (selection.w === 0 || selection.h === 0) {
              canvas.width = 128;
              canvas.height = 128;
              context.drawImage(image, 0, 0, 128, 128);
            } else {
              canvas.width = selection.w * ratio;
              canvas.height = selection.h * ratio;
              context.drawImage(image, selection.x * ratio, selection.y * ratio, selection.w * ratio, selection.h * ratio, 0, 0, canvas.width, canvas.height);
            }

            var mime = 'image/png';
            canvas.toBlob(function(blob) {

              communityAPI.uploadAvatar(data.data._id, blob, mime)
                .progress(function(evt) {
                  var value = parseInt(80.0 * evt.loaded / evt.total);
                  $scope.percent = 20 + value;

                }).success(function() {
                  $scope.percent = 100;
                  $scope.create.step = 'redirect';
                  return done(data.data._id);

                }).error(function(error) {
                  $scope.percent = 100;
                  $scope.create.step = 'uploadfailed';
                  $scope.create.error = error;
                  return done(data.data._id);
                });
            }, mime);

          } else {
            $scope.percent = 100;
            $scope.create.step = 'redirect';
            return done(data.data._id);
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
  .controller('communitiesController', ['$scope', '$log', 'session', 'communityAPI', 'userAPI', function($scope, $log, session, communityAPI, userAPI) {
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
          $scope.communities = [];
        }
      ).finally (
        function() {
          $scope.loading = false;
        }
      );
    };

    $scope.getMembership = function() {
      $scope.selected = 'membership';
      $scope.loading = true;

      userAPI.getCommunities().then(
        function(response) {
          $scope.communities = response.data;
        },
        function(err) {
          $log.error('Error while getting communities', err);
          $scope.error = true;
          $scope.communities = [];
        }
      ).finally (
        function() {
          $scope.loading = false;
        }
      );
    };

    $scope.getModerator = function() {
      $scope.selected = 'moderator';

      $scope.loading = true;
      var options = {
        creator: session.user._id
      };

      communityAPI.list(session.domain._id, options).then(
        function(response) {
          $scope.communities = response.data;
        },
        function(err) {
          $log.error('Error while getting communities', err);
          $scope.error = true;
          $scope.communities = [];
        }
      ).finally (
        function() {
          $scope.loading = false;
        }
      );
    };

    $scope.getAll();
  }])
  .directive('communityDisplay', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/community/community-display.html'
    };
  })
  .directive('communityDescription', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/community/community-description.html'
    };
  })
  .controller('communityController', ['$scope', '$location', '$log', 'session', 'communityAPI', 'community', function($scope, $location, $log, session, communityAPI, community) {
    $scope.community = community;
    $scope.error = false;
    $scope.loading = false;

    $scope.canJoin = function() {
      return !$scope.community.members.some(function(member) {
        return member.user === session.user._id;
      });
    };

    $scope.isCreator = function() {
      return session.user._id === $scope.community.creator;
    };

    $scope.canLeave = function() {
      return !$scope.canJoin() && !$scope.isCreator();
    };

    $scope.join = function() {
      communityAPI.join(community._id, session.user._id).then(
        function() {
          communityAPI.get($scope.community._id).then(
            function(response) {
              $scope.community = response.data;
            },
            function(err) {
              $log.error('Error while loading community', err);
            }
          );
        },
        function(err) {
          $log.error('Error while joining community', err);
          $scope.error = true;
        }
      ).finally (
        function() {
          $scope.loading = false;
        }
      );
    };

    $scope.leave = function() {
      communityAPI.leave(community._id, session.user._id).then(
        function() {
          $location.path('/communities');
        },
        function(err) {
          $log.error('Error while leaving community', err);
          $scope.error = true;
        }
      ).finally (
        function() {
          $scope.loading = false;
        }
      );
    };
  }]
);
