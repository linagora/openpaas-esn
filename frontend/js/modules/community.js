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
  .controller('communityCreateController', ['$rootScope', '$scope', '$location', '$timeout', '$log', '$alert', 'session', 'communityAPI', '$upload', 'selectionService',
    function($rootScope, $scope, $location, $timeout, $log, $alert, session, communityAPI, $upload, selectionService) {
    selectionService.clear();

    var initScope = function() {
      $scope.step = 0;
      $scope.sending = false;
      $scope.validationError = {};
      $scope.community = {
        domain_ids: [session.domain._id],
        image: '',
        type: 'open'
      };
      $scope.alert = undefined;
      $scope.percent = 0;
      $scope.createStatus = {
        step: 'none',
        created: false
      };
      $scope.imageselected = false;
      $scope.imagevalidated = false;
    };
    initScope();

    $rootScope.$on('crop:loaded', function() {
      $scope.imageselected = true;
      $scope.imagevalidated = false;
      $scope.$apply();
    });

    $scope.isTitleEmpty = function() {
      return !$scope.community.title;
    };

    $scope.onInputChange = function() {
      $scope.validationError = {};
    };

    $scope.isTitleInvalid = function() {
      return $scope.communityForm.title.$error.unique || $scope.validationError.unique;
    };

    $scope.titleValidationRunning = false;
    $scope.validateStep0 = function() {
      if ($scope.titleValidationRunning) {
        return;
      }
      $scope.titleValidationRunning = true;

      communityAPI.list(session.domain._id, {title: $scope.community.title}).then(
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

    $scope.validateImage = function() {
      $scope.imagevalidated = true;
    };

    $scope.removeSelectedImage = function() {
      selectionService.clear();
      $scope.imageselected = false;
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
      $scope.createStatus.step = 'post';
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
          if ($scope.createModal) {
            $scope.createModal.hide();
          }
          selectionService.clear();
          $location.path('/communities/' + id);
        }, 1000);
      }

      communityAPI.create(community).then(
        function(data) {

          $scope.createStatus.created = true;

          if (selectionService.getImage()) {
            $scope.createStatus.step = 'upload';
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
            $scope.createStatus.step = 'redirect';
            return done(data.data._id);
          }
        },
        function(err) {
          $scope.sending = false;
          $scope.createStatus.error = err;
          $scope.createStatus.step = 'none';
          $log.error('Error ', err);
          return $scope.displayError('Error while creating the community');
        }
      );
    };
  }])
  .controller('communitiesController', ['$scope', '$log', '$location', 'session', 'communityAPI', 'userAPI',
  function($scope, $log, $location, session, communityAPI, userAPI) {
    $scope.communities = [];
    $scope.error = false;
    $scope.loading = false;
    $scope.user = session.user;
    $scope.selected = '';

    function refreshCommunity(community) {
      communityAPI.get(community._id).then(
        function(response) {
          var updatedCommunity = response.data;
          for (var i = 0, len = $scope.communities.length; i < len; i++) {
            if ($scope.communities[i]._id === community._id) {
              $scope.communities[i] = updatedCommunity;
            }
          }
        },
        function(err) {
          $log.error('Error while loading community', err);
        }
      );
    }

    $scope.joinSuccess = function(community) {
      $location.path('/communities/' + community._id);
    };

    $scope.joinFailure = function(community) {
      $log.error('failed to join community', community);
      refreshCommunity(community);
    };

    $scope.leaveSuccess = function(community) {
      refreshCommunity(community);
    };

    $scope.leaveFailure = function(community) {
      $log.error('failed to leave community', community);
      refreshCommunity(community);
    };

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
  .directive('communityButtonJoin', ['communityMembership', function(communityMembership) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/community/community-button-join.html',
      replace: true,
      link: function($scope) {
        $scope.disabled = false;
        $scope.join = function() {
          $scope.disabled = true;
          communityMembership.join($scope.community, $scope.user)
          .then($scope.onJoin, $scope.onFail)
          .finally (function() {
            $scope.disabled = false;
          });
        };

        $scope.canJoin = function() {
          return $scope.user._id !== $scope.community.creator &&
                 communityMembership.openMembership($scope.community) &&
                 !communityMembership.isMember($scope.community);
        };
      },
      scope: {
        community: '=',
        user: '=',
        onJoin: '&',
        onFail: '&'
      }
    };
  }])
  .directive('communityButtonLeave', ['communityMembership', function(communityMembership) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/community/community-button-leave.html',
      replace: true,
      link: function($scope) {
        $scope.disabled = false;
        $scope.leave = function() {
          $scope.disabled = true;
          communityMembership.leave($scope.community, $scope.user)
          .then($scope.onLeave, $scope.onFail)
          .finally (function() {
            $scope.disabled = false;
          });
        };

        $scope.canLeave = function() {
          return $scope.user._id !== $scope.community.creator &&
                 communityMembership.isMember($scope.community);
        };
      },
      scope: {
        community: '=',
        user: '=',
        onLeave: '&',
        onFail: '&'
      }
    };
  }])
  .directive('communityButtonCreate', ['$modal', function($modal) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/community/community-button-create.html',
      link: function($scope) {
        $scope.createModal = $modal({scope: $scope, template: '/views/modules/community/community-create-modal', show: false});
        $scope.showCreateModal = function() {
          $scope.createModal.$promise.then($scope.createModal.show);
        };
      }
    };
  }])
  .controller('communityController', ['$scope', '$location', '$log', 'session', 'communityAPI', 'community', function($scope, $location, $log, session, communityAPI, community) {
    $scope.community = community;
    $scope.user = session.user;
    $scope.error = false;
    $scope.loading = false;
    $scope.writable = community.writable;

    $scope.$on('community:membership', function(data) {
      communityAPI.get(community._id).then(function(response) {
        $scope.writable = response.data.writable;
      });
    });

    $scope.onLeave = function() {
      $location.path('/communities');
    };

    $scope.reload = function() {
      communityAPI.get($scope.community._id)
      .then(function(response) {
        $scope.community = response.data;
      });
    };

    $scope.joinFailure = function() {
      $log.error('unable to join community');
      $scope.reload();
    };

    $scope.leaveFailure = function() {
      $log.error('unable to leave community');
      $scope.reload();
    };
  }])
  .directive('ensureUniqueCommunityTitle', ['communityAPI', 'session', '$timeout', function(communityAPI, session, $timeout) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, elem , attrs, control) {
        var lastValue = null;
        var timer = null;

        var checkNameValidity = function() {
          control.$setValidity('ajax', false);
          (function(title) {
            communityAPI.list(session.domain._id, {title: title}).then(
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
          var communityTitle = control.$viewValue;
          if (communityTitle === lastValue) {
            return;
          }
          lastValue = communityTitle;

          control.$setValidity('unique', true);
          if (timer) {
            $timeout.cancel(timer);
          }

          if (communityTitle.length === 0) {
            control.$setValidity('ajax', true);
            return;
          }

          control.$setValidity('ajax', false);
          timer = $timeout(checkNameValidity, 1000);
        });
      }
    };
  }])
  .factory('communityMembership', ['communityAPI', '$q', function(communityAPI, $q) {
    function isMember(community) {
      if (!community || !community.member_status) {
        return false;
      }
      return community.member_status === 'member';
    }

    function openMembership(community) {
      return (community.type === 'open');
    }

    function join(community, user) {
      if (isMember(community)) {
        var defer = $q.defer();
        defer.reject('Can not join the community');
        return defer.promise;
      }
      return communityAPI.join(community._id, user._id);
    }

    function leave(community, user) {
      if (!isMember(community)) {
        var defer = $q.defer();
        defer.reject('Can not leave the community');
        return defer.promise;
      }
      return communityAPI.leave(community._id, user._id);
    }

    return {
      openMembership: openMembership,
      isMember: isMember,
      join: join,
      leave: leave
    };
  }]);
