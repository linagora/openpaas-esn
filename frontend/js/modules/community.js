'use strict';

angular.module('esn.community', ['esn.session', 'esn.user', 'esn.avatar', 'restangular', 'mgcrea.ngStrap.alert', 'mgcrea.ngStrap.modal', 'mgcrea.ngStrap.tooltip', 'angularFileUpload', 'esn.infinite-list', 'openpaas-logo', 'esn.object-type', 'ngTagsInput'])
  .run(['objectTypeResolver', 'communityAPI', function(objectTypeResolver, communityAPI) {
    objectTypeResolver.register('community', communityAPI.get);
  }])
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

    function getMembers(id, options) {
      return Restangular.one('communities', id).all('members').getList(options);
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

    function getRequestMemberships(id, options) {
      var query = options || {};
      return Restangular.one('communities', id).all('membership').getList(query);
    }

    function requestMembership(id, member) {
      return Restangular.one('communities', id).one('membership', member).put();
    }

    function cancelRequestMembership(id, member) {
      return Restangular.one('communities', id).one('membership', member).remove();
    }

    function getInvitablePeople(id, options) {
      var query = options || {};
      return Restangular.one('communities', id).all('invitablepeople').getList(query);
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
      leave: leave,
      requestMembership: requestMembership,
      cancelRequestMembership: cancelRequestMembership,
      getRequestMemberships: getRequestMemberships,
      getInvitablePeople: getInvitablePeople
    };
  }])
  .controller('communityCreateController', ['$rootScope', '$scope', '$location', '$timeout', '$log', '$alert', 'session', 'communityAPI', '$upload', 'selectionService',
    function($rootScope, $scope, $location, $timeout, $log, $alert, session, communityAPI, $upload, selectionService) {
    selectionService.clear();
    var alertInstance;

    function destroyAlertInstance() {
      if (alertInstance) {
        alertInstance.destroy();
        alertInstance = null;
      }
    }

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

    $scope.$on('crop:loaded', function() {
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
    $scope.$on('crop:reset', function() {
      destroyAlertInstance();
      selectionService.clear();
    });
    $scope.$on('crop:error', function(context, error) {
      if (error) {
        alertInstance = $alert({
          title: 'Error',
          content: error,
          type: 'danger',
          show: true,
          position: 'bottom',
          container: '#error',
          animation: 'am-fade'
        });
      }
    });

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
            var mime = 'image/png';
            selectionService.getBlob(mime, function(blob) {
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
            });

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

    $scope.requestMembershipSuccess = function(community) {
      refreshCommunity(community);
    };

    $scope.requestMembershipFailure = function(community) {
      $log.error('failed to request membership to the community', community);
      refreshCommunity(community);
    };

    $scope.cancelRequestMembershipSuccess = function(community) {
      refreshCommunity(community);
    };

    $scope.cancelRequestMembershipFailure = function(community) {
      $log.error('failed to cancel request membership to the community', community);
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
  .controller('communityMembersController', ['$scope', 'communityAPI', 'usSpinnerService', function($scope, communityAPI, usSpinnerService) {
    var community_id = $scope.community._id;
    $scope.spinnerKey = 'membersSpinner';

    var opts = {
      offset: 0,
      limit: 20
    };

    $scope.total = 0;

    $scope.members = [];
    $scope.restActive = false;
    $scope.error = false;

    var updateMembersList = function() {
      $scope.error = false;
      if ($scope.restActive) {
        return;
      } else {
        $scope.restActive = true;
        usSpinnerService.spin($scope.spinnerKey);

        communityAPI.getMembers(community_id, opts).then(function(data) {
          $scope.total = parseInt(data.headers('X-ESN-Items-Count'));
          $scope.members = $scope.members.concat(data.data);
        }, function() {
          $scope.error = true;
        }).finally (function() {
          $scope.restActive = false;
          usSpinnerService.stop($scope.spinnerKey);
        });
      }
    };

    $scope.init = function() {
      updateMembersList();
    };

    $scope.loadMoreElements = function() {
      if ($scope.members.length === 0 || $scope.members.length < $scope.total) {
        opts.offset = $scope.members.length;
        updateMembersList();
      }
    };

    $scope.init();
  }])
  .directive('communityDisplay', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/community/community-display.html'
    };
  })
  .directive('communityPendingInvitationList', ['communityAPI', '$animate', function(communityAPI, $animate) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/community/community-pending-invitation-list.html',
      link: function($scope, $element) {
        var calling = false;

        function getErrorElement() {
          return $($element.find('[error-container]')[0]);

        }

        function getLoadingElement() {
          return $($element.find('[loading-container]')[0]);
        }

        $scope.updatePendingRequestsList = function() {
          if (calling) {
            return;
          }

          getLoadingElement().removeClass('hidden');
          getErrorElement().addClass('hidden');
          calling = true;

          communityAPI.getRequestMemberships($scope.community._id, {}).then(function(response) {
            $scope.requests = response.data;
          }, function() {
            getErrorElement().removeClass('hidden');
          }).finally (function() {
            calling = false;
            getLoadingElement().addClass('hidden');
          });
        };

        $scope.updatePendingRequestsList();
      }
    };
  }])
  .directive('communityPendingInvitationDisplay', ['communityAPI', function(communityAPI) {
    return {
      restrict: 'E',
      scope: {
        request: '=',
        community: '='
      },
      templateUrl: '/views/modules/community/community-pending-invitation-display.html',
      link: function($scope, $element) {
        var button = $element.find('.btn');
        $scope.cancel = function() {
          button.attr('disabled', 'disabled');
          communityAPI.cancelRequestMembership($scope.community._id, $scope.request.user._id).then(function() {
            button.hide();
          }, function() {
            button.removeAttr('disabled');
          });
        };
      }
    };
  }])
  .directive('communityDescription', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/community/community-description.html'
    };
  })
  .directive('communityButtonJoin', ['communityService', function(communityService) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/community/community-button-join.html',
      replace: true,
      link: function($scope) {
        $scope.disabled = false;
        $scope.join = function() {
          $scope.disabled = true;
          communityService.join($scope.community, $scope.user)
          .then($scope.onJoin, $scope.onFail)
          .finally (function() {
            $scope.disabled = false;
          });
        };

        $scope.canJoin = function() {
          return communityService.canJoin($scope.community, $scope.user);
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
  .directive('communityButtonLeave', ['communityService', function(communityService) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/community/community-button-leave.html',
      replace: true,
      link: function($scope) {
        $scope.disabled = false;
        $scope.leave = function() {
          $scope.disabled = true;
          communityService.leave($scope.community, $scope.user)
          .then($scope.onLeave, $scope.onFail)
          .finally (function() {
            $scope.disabled = false;
          });
        };

        $scope.canLeave = function() {
          return communityService.canLeave($scope.community, $scope.user);
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
  .directive('communityButtonRequestMembership', ['communityService', function(communityService) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/community/community-button-request-membership.html',
      replace: true,
      link: function($scope) {
        $scope.disabled = false;
        $scope.requestMembership = function() {
          $scope.disabled = true;
          communityService.requestMembership($scope.community, $scope.user)
            .then($scope.onRequest, $scope.onFail)
            .finally (function() {
              $scope.disabled = false;
            });
        };

        $scope.canRequestMembership = function() {
          return communityService.canRequestMembership($scope.community, $scope.user);
        };
      },
      scope: {
        community: '=',
        user: '=',
        onRequest: '&',
        onFail: '&'
      }
    };
  }])
  .directive('communityButtonCancelRequestMembership', ['communityService', function(communityService) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/community/community-button-cancel-request-membership.html',
      replace: true,
      link: function($scope) {
        $scope.disabled = false;
        $scope.cancelRequestMembership = function() {
          $scope.disabled = true;
          communityService.cancelRequestMembership($scope.community, $scope.user)
            .then($scope.onCancelRequest, $scope.onFail)
            .finally (function() {
            $scope.disabled = false;
          });
        };

        $scope.canCancelRequestMembership = function() {
          return communityService.canCancelRequestMembership($scope.community, $scope.user);
        };
      },
      scope: {
        community: '=',
        user: '=',
        onCancelRequest: '&',
        onFail: '&'
      }
    };
  }])
  .directive('communityButtonCreate', ['$modal', function($modal) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/community/community-button-create.html',
      scope: true,
      link: function($scope) {
        $scope.$on('modal.hide', function(evt, modal) {
          $scope.createModal = null;
          modal.destroy();
        });
        $scope.showCreateModal = function() {
          $scope.createModal = $modal({scope: $scope, template: '/views/modules/community/community-create-modal'});
        };
      }
    };
  }])
  .controller('communityController', ['$rootScope', '$scope', '$location', '$log', 'session', 'communityAPI', 'communityService', 'community',
  function($rootScope, $scope, $location, $log, session, communityAPI, communityService, community) {
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

    function currentCommunityMembershipHandler(event, msg) {
      $log.debug('Got a community membership event on community', msg);
      if (msg && msg.community === $scope.community._id) {
        communityAPI.get(msg.community).then(function(response) {
          $scope.writable = response.data.writable;
          $scope.community = response.data;
        });
      }
    }

    var unregisterJoinEvent = $rootScope.$on('community:join', currentCommunityMembershipHandler);
    var unregisterLeaveEvent = $rootScope.$on('community:leave', currentCommunityMembershipHandler);

    $scope.$on('$destroy', function() {
      unregisterJoinEvent();
      unregisterLeaveEvent();
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

    $scope.requestMembershipFailure = function() {
      $log.error('unable to request membership to the community');
      $scope.reload();
    };

    $scope.cancelRequestMembershipFailure = function() {
      $log.error('unable to cancel request membership to the community');
      $scope.reload();
    };

    $scope.canRead = function() {
      return communityService.canRead(community);
    };
    $scope.isCommunityMember = function() {
      return communityService.isMember(community);
    };
    $scope.isCommunityManager = function() {
      return communityService.isManager(community, session.user);
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
  .factory('communityService', ['communityAPI', '$q', function(communityAPI, $q) {

    function isManager(community, user) {
      return community.creator === user._id;
    }

    function isMember(community) {
      if (!community || !community.member_status) {
        return false;
      }
      return community.member_status === 'member';
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

    function canLeave(community, user) {
      return user._id !== community.creator &&
        isMember(community);
    }

    function canJoin(community, user) {
      return user._id !== community.creator &&
        community.type === 'open' &&
        !isMember(community);
    }

    function canRead(community) {
      return community.type === 'open' ||
        community.type === 'restricted' ||
        isMember(community);
    }

    function canRequestMembership(community, user) {
      return user._id !== community.creator &&
        community.type !== 'open' &&
        !isMember(community) &&
        !community.membershipRequest;
    }

    function canCancelRequestMembership(community, user) {
      return user._id !== community.creator &&
        community.type !== 'open' &&
        !isMember(community) &&
        community.membershipRequest;
    }

    function requestMembership(community, user) {
      if (isMember(community)) {
        var defer = $q.defer();
        defer.reject('User is already a member, can not request membership');
        return defer.promise;
      }
      return communityAPI.requestMembership(community._id, user._id);
    }

    function cancelRequestMembership(community, user) {
      if (isMember(community)) {
        var defer = $q.defer();
        defer.reject('User is already a member, can not cancel request membership');
        return defer.promise;
      }
      return communityAPI.cancelRequestMembership(community._id, user._id);
    }

    return {
      isMember: isMember,
      isManager: isManager,
      join: join,
      leave: leave,
      canJoin: canJoin,
      canLeave: canLeave,
      canRead: canRead,
      canRequestMembership: canRequestMembership,
      canCancelRequestMembership: canCancelRequestMembership,
      requestMembership: requestMembership,
      cancelRequestMembership: cancelRequestMembership
    };
  }])
  .directive('communitiesEventListener', ['$rootScope', 'livenotification', function($rootScope, livenotification) {
    return {
      restrict: 'A',
      replace: true,
      link: function($scope) {
        var join = function(data) {
          $rootScope.$emit('community:join', data);
        };

        var leave = function(data) {
          $rootScope.$emit('community:leave', data);
        };

        livenotification('/community').on('join', join);
        livenotification('/community').on('leave', leave);

        $scope.$on('$destroy', function() {
          livenotification('/community').removeListener('join', join);
          livenotification('/community').removeListener('leave', leave);
        });
      }
    };
  }])
  .directive('communityMembersWidget', ['$rootScope', 'communityAPI', function($rootScope, communityAPI) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '='
      },
      templateUrl: '/views/modules/community/community-members-widget.html',
      link: function($scope, element, attrs) {
        $scope.inSlicesOf = attrs.inSlicesOf && angular.isNumber(parseInt(attrs.inSlicesOf, 10)) ?
          parseInt(attrs.inSlicesOf, 10) : 3;
        $scope.error = false;

        function sliceMembers(members) {
          if ($scope.inSlicesOf < 1 || !angular.isArray(members)) {
            return members;
          }
          var array = [];
          for (var i = 0; i < members.length; i++) {
            var chunkIndex = parseInt(i / $scope.inSlicesOf, 10);
            var isFirst = (i % $scope.inSlicesOf === 0);
            if (isFirst) {
              array[chunkIndex] = [];
            }
            array[chunkIndex].push(members[i]);
          }
          return array;
        }

        $scope.updateMembers = function() {
          communityAPI.getMembers($scope.community._id, {limit: 16}).then(function(result) {
            var total = parseInt(result.headers('X-ESN-Items-Count'));
            var members = result.data;
            $scope.more = total - members.length;
            $scope.members = sliceMembers(members);
          }, function() {
            $scope.error = true;
          });
        };

        var communityJoinRemover = $rootScope.$on('community:join', $scope.updateMembers);
        var communityLeaveRemover = $rootScope.$on('community:leave', $scope.updateMembers);
        element.on('$destroy', function() {
          communityJoinRemover();
          communityLeaveRemover();
        });
        $scope.updateMembers();
      }
    };
  }])
  .directive('communityMembershipRequestsWidget', ['$rootScope', 'communityAPI', function($rootScope, communityAPI) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '='
      },
      templateUrl: '/views/modules/community/community-membership-requests-widget.html',
      controller: function($scope) {

        $scope.error = false;
        $scope.loading = false;

        $scope.updateRequests = function() {
          $scope.loading = true;
          $scope.error = false;
          communityAPI.getRequestMemberships($scope.community._id).then(function(response) {
            $scope.requests = response.data || [];
          }, function() {
            $scope.error = true;
          }).finally (function() {
            $scope.loading = false;
          });
        };

        $scope.updateRequests();

        var removeRequestEntry = function(event, data) {
          if (!data.community || data.community !== $scope.community._id) {
            return;
          }
          $scope.requests = $scope.requests.filter(function(request) {
            return request.user._id !== data.user;
          });
        };

        $rootScope.$on('community:request:declined', removeRequestEntry);
        $rootScope.$on('community:request:accepted', removeRequestEntry);
      }
    };
  }])
  .directive('communityMembershipRequestsActions', ['$rootScope', 'communityAPI', function($rootScope, communityAPI) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '=',
        user: '='
      },
      templateUrl: '/views/modules/community/community-membership-requests-actions.html',
      controller: function($scope) {

        $scope.error = false;
        $scope.sending = false;
        $scope.done = false;

        $scope.accept = function() {
          $scope.sending = true;
          $scope.error = false;
          communityAPI.join($scope.community._id, $scope.user._id).then(function() {
            $scope.done = true;
            $rootScope.$emit('community:request:accepted', {community: $scope.community._id, user: $scope.user._id});
          }, function() {
            $scope.error = true;
          }).finally (function() {
            $scope.sending = false;
          });
        };

        $scope.decline = function() {
          $scope.sending = true;
          $scope.error = false;
          communityAPI.cancelRequestMembership($scope.community._id, $scope.user._id).then(function() {
            $scope.done = true;
            $rootScope.$emit('community:request:declined', {community: $scope.community._id, user: $scope.user._id});
          }, function() {
            $scope.error = true;
          }).finally (function() {
            $scope.sending = false;
          });
        };
      }
    };
  }])
  .directive('communityMemberAvatar', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        member: '=',
        community: '='
      },
      templateUrl: '/views/modules/community/community-member-avatar.html',
      controller: function($scope) {
        var title = '';
        if ($scope.member.user.firstname || $scope.member.user.lastname) {
          title = ($scope.member.user.firstname || '') + ' ' + ($scope.member.user.lastname || '');
        } else {
          title = $scope.member.user.emails[0];
        }

        $scope.tooltip = {
          title: title
        };

        if ($scope.community.creator === $scope.member.user._id) {
          $scope.creator = true;
        }
      }
    };
  })
  .directive('communityInjectionsWidget', function($compile) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var buildHtmlFromInjectionData = function(injectionData) {
          var attributes = {class: 'community-injection'};
          if (injectionData.attributes) {
            injectionData.attributes.forEach(function(attribute) {
              attributes[attribute.name] = attribute.value;
            });
          }
          var e = $('<' + injectionData.directive + '/>');
          e.attr(attributes);
          return e;
        };

        element.hide();
        var anchorId = attrs.communityInjectionsWidget;
        if (!anchorId || !scope.community || !scope.community.injections) {
          return;
        }
        var thisAnchorInjections = scope.community.injections.filter(function(injection) {
          return injection.key === anchorId;
        });
        if (thisAnchorInjections.length === 0) {
          return;
        }
        else {
          thisAnchorInjections.forEach(function(injection) {
            injection.values.forEach(function(injectionData) {
              var template = angular.element(buildHtmlFromInjectionData(injectionData));
              var newElt = $compile(template)(scope);
              element.append(newElt);
            });
          });
          element.show();
        }
      }
    };
  })
  .directive('communityInviteUsers', ['$q', 'communityAPI', 'communityService', 'session',
    function($q, communityAPI, communityService, session) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '='
      },
      templateUrl: '/views/modules/community/community-invite-users.html',
      link: function($scope, $element) {
        $scope.placeholder = 'Enter a user name or email';
        $scope.displayProperty = 'displayName';
        $scope.running = false;

        $scope.getErrorDiv = function() {
          return $element.children('[error-container]');
        };
        $scope.getRunningDiv = function() {
          return $element.children('.form-container').children('form').children('fieldset').find('[running-container]');
        };
        $scope.getButtonContent = function() {
          return $element.children('.form-container').children('form').children('fieldset').find('[button-content]');
        };
        $scope.getSuccessDiv = function() {
          return $element.children('.form-container').children('form').children('fieldset').find('[success-container]');
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
          $scope.getSuccessDiv().removeClass('hidden');
        };
        $scope.hideSuccessMessage = function() {
          $scope.getSuccessDiv().addClass('hidden');
        };

        $scope.resetMessages = function() {
          $scope.hideErrorMessage();
          $scope.hideSuccessMessage();
        };

        $scope.getInvitablePeople = function(query) {
          var deferred = $q.defer();
          communityAPI.getInvitablePeople($scope.community._id, {search: query, limit: 5}).then(
            function(response) {
              response.data.forEach(function(user) {
                if (user.firstname && user.lastname) {
                  user.displayName = user.firstname + ' ' + user.lastname;
                }
                else {
                  user.displayName = user.emails[0];
                }
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
          if (!$scope.users || $scope.users.length === 0) {
            return;
          }
          if ($scope.running) {
            return;
          }
          $scope.resetMessages();
          $scope.running = true;
          $scope.showRunning();

          var promises = [];
          $scope.users.forEach(function(user) {
            promises.push(communityAPI.requestMembership($scope.community._id, user._id));
          });

          $q.all(promises).then(
            function() {
              $scope.users = [];
              $scope.running = false;
              $scope.hideRunning();
              $scope.showSuccessMessage();
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

        if (communityService.isManager($scope.community, session.user)) {
          $element.removeClass('hidden');
        }
      }
    };
  }]);
