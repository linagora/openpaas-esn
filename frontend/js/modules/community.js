'use strict';

angular.module('esn.community', ['esn.activitystreams-tracker', 'esn.session', 'esn.user', 'esn.avatar', 'esn.calendar', 'restangular', 'mgcrea.ngStrap.alert', 'mgcrea.ngStrap.tooltip', 'angularFileUpload', 'esn.infinite-list', 'openpaas-logo', 'esn.object-type', 'ngTagsInput', 'ui.calendar', 'esn.widget.helper'])
  .config(['tagsInputConfigProvider', function(tagsInputConfigProvider) {
    tagsInputConfigProvider.setActiveInterpolation('tagsInput', {
      placeholder: true,
      displayProperty: true
    });
  }])
  .run(['objectTypeResolver', 'objectTypeAdapter', 'communityAPI', 'communityAdapterService', 'Restangular', 'ASTrackerSubscriptionService', function(objectTypeResolver, objectTypeAdapter, communityAPI, communityAdapterService, Restangular, ASTrackerSubscriptionService) {
    objectTypeResolver.register('community', communityAPI.get);
    objectTypeAdapter.register('community', communityAdapterService);
    Restangular.extendModel('communities', function(model) {
      return communityAdapterService(model);
    });
    ASTrackerSubscriptionService.register('community', {get: communityAPI.get});
  }])
  .factory('communityAdapterService', function() {
    return function(community) {
      community.htmlUrl = '/#/communities/' + community._id;
      community.url = '/#/communities/' + community._id;
      community.avatarUrl = '/api/avatars?objectType=community&id=' + community._id;
      community.displayName = community.title;
      community.objectType = 'community';
      return community;
    };
  })
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

    function getMember(id, member) {
      return Restangular.one('communities', id).one('members', member).get();
    }

    return {
      list: list,
      get: get,
      del: del,
      create: create,
      uploadAvatar: uploadAvatar,
      getMember: getMember
    };
  }])
  .factory('communityCreationService', ['$q', '$log', '$timeout', 'communityAPI',
   function($q, $log, $timeout, communityAPI) {

    function notifyProgress(d, step, percent) {
      d.notify({
        step: step,
        percent: percent
      });
    }

    function createCommunity(community) {
      if (!community) {
        $log.error('Missing community');
        return $q.reject('Community information is missing');
      }

      if (!community.title) {
        $log.error('Missing community title');
        return $q.reject('Community title is missing');
      }

      if (!community.domain_ids || community.domain_ids.length === 0) {
        $log.error('Missing community domain');
        return $q.error('Domain is missing, try reloading the page');
      }

      if (!community.type) {
        community.type = 'open';
      }

      var avatar = community.avatar;
      delete community.avatar;

      var d = $q.defer();

      $timeout(function() {
        notifyProgress(d, 'post', 1);
      },0);

      communityAPI.create(community).then(
        function(data) {
          var communityId = data.data._id;
          if (avatar.exists()) {
            notifyProgress(d, 'upload', 20);
            var mime = 'image/png';
            avatar.getBlob(mime, function(blob) {
              communityAPI.uploadAvatar(communityId, blob, mime)
              .progress(function(evt) {
                var value = 20 + parseInt(80.0 * evt.loaded / evt.total, 10);
                notifyProgress(d, 'upload', value);
              }).success(function() {
                return d.resolve(communityId);
              }).error(function(err) {
                $log.error(err);
                d.notify({uploadFailed: err});
                return d.resolve(communityId);
              });
            });
          } else {
            return d.resolve(communityId);
          }
        },
        function(err) {
          $log.error(err);
          d.reject(err);
        }
      );
      return d.promise;
    }
    return createCommunity;
  }])
  .directive('communityCreateButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/community/community-create-button.html'
    };
  })
  .directive('communityCreate',
  ['widget.wizard', 'selectionService', 'communityCreationService', '$timeout', '$location', '$alert',
  function(Wizard, selectionService, communityCreationService, $timeout, $location, $alert) {
    function link($scope, element, attrs) {
      $scope.wizard = new Wizard([
        '/views/modules/community/community-creation-wizard-1',
        '/views/modules/community/community-creation-wizard-2',
        '/views/modules/community/community-creation-wizard-3'
      ]);
      selectionService.clear();

      $scope.community = {
        domain_ids: [$scope.domain._id],
        type: 'open'
      };

      $scope.createCommunity = function() {
        $scope.wizard.nextStep();
        $scope.community.avatar = {
          exists: function() { return selectionService.getImage() ? true : false; },
          getBlob: function(mime, callback) { return selectionService.getBlob(mime, callback); }
        };
        $scope.create =  { step: 'post', percent: 1 };
        communityCreationService($scope.community)
        .then(onSuccess, onFailure, onNotification);
      };

      $scope.displayError = function(err) {
        $scope.alert = $alert({
          content: err,
          type: 'danger',
          show: true,
          position: 'bottom',
          container: element.find('p.error')
        });
      };

      function onSuccess(id) {
        selectionService.clear();
        if (!$scope.uploadFailed) {
          $scope.create = { step: 'redirect', percent: 100 };
        }
        $scope.$emit('collaboration:join', {collaboration: {id: id, objectType: 'community'}});
        $timeout(function() {
          if ($scope.createModal) {
            $scope.createModal.hide();
          }
          $location.path('/communities/' + id);
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
        return $scope.displayError('Error while creating the community');
      }
    }

    return {
      restrict: 'E',
      templateUrl: '/views/modules/community/community-create.html',
      scope: {
        user: '=',
        domain: '=',
        createModal: '='
      },
      link: link
    };

  }])
  .controller('communitiesController', ['$scope', '$log', '$location', 'communityAPI', 'userAPI', 'domain', 'user',
  function($scope, $log, $location, communityAPI, userAPI, domain, user) {
    $scope.communities = [];
    $scope.error = false;
    $scope.loading = false;
    $scope.user = user;
    $scope.domain = domain;
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
      communityAPI.list(domain._id).then(
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
        creator: user._id
      };

      communityAPI.list(domain._id, options).then(
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
  .directive('communityPendingInvitationList', ['collaborationAPI', '$animate', function(collaborationAPI, $animate) {
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

          collaborationAPI.getRequestMemberships('community', $scope.community._id, {}).then(function(response) {
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
  .directive('communityPendingInvitationDisplay', ['collaborationAPI', function(collaborationAPI) {
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
          collaborationAPI.cancelRequestMembership('community', $scope.community._id, $scope.request.user._id).then(function() {
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
  .controller('communityController', ['$rootScope', '$scope', '$location', '$log', 'session', 'communityAPI', 'communityService', 'objectTypeAdapter', 'community', 'memberOf',
  function($rootScope, $scope, $location, $log, session, communityAPI, communityService, objectTypeAdapter, community, memberOf) {
    $scope.community = community;
    $scope.user = session.user;
    $scope.error = false;
    $scope.loading = false;
    $scope.writable = community.writable;
    $scope.streams = memberOf.map(function(collaboration) {
      return objectTypeAdapter.adapt(collaboration);
    });

    $scope.$on('collaboration:membership', function(data) {
      communityAPI.get($scope.community._id).then(function(response) {
        $scope.writable = response.data.writable;
      });
    });

    function currentCommunityMembershipHandler(event, msg) {
      if (msg && msg.collaboration && msg.collaboration.objectType !== 'community') {
        return;
      }
      $log.debug('Got a community membership event on community', msg);
      if (msg && msg.collaboration.id === $scope.community._id) {
        communityAPI.get(msg.collaboration.id).then(function(response) {
          $scope.writable = response.data.writable;
          $scope.community = response.data;
        });
      }
    }

    var unregisterJoinEvent = $rootScope.$on('collaboration:join', currentCommunityMembershipHandler);
    var unregisterLeaveEvent = $rootScope.$on('collaboration:leave', currentCommunityMembershipHandler);

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
    $scope.showMembershipRequestsWidget = function() {
      return $scope.isCommunityManager() && community.type !== 'open';
    };
  }])
  .directive('ensureUniqueCommunityTitle', ['communityAPI', '$q', function(communityAPI, $q) {
    return {
      require: 'ngModel',
      link: function($scope, element, attrs, ngModel) {
        ngModel.$asyncValidators.unique = function(title) {
          return communityAPI.list(attrs.domainId, {title: title}).then(
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
  .factory('communityService', ['collaborationAPI', '$q', function(collaborationAPI, $q) {

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
      return collaborationAPI.join('community', community._id, user._id);
    }

    function leave(community, user) {
      if (!isMember(community)) {
        var defer = $q.defer();
        defer.reject('Can not leave the community');
        return defer.promise;
      }
      return collaborationAPI.leave('community', community._id, user._id);
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
      return collaborationAPI.requestMembership('community', community._id, user._id);
    }

    function cancelRequestMembership(community, user) {
      if (isMember(community)) {
        var defer = $q.defer();
        defer.reject('User is already a member, can not cancel request membership');
        return defer.promise;
      }
      return collaborationAPI.cancelRequestMembership('community', community._id, user._id);
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
  .directive('communityMembershipRequestsWidget', ['$rootScope', 'collaborationAPI', function($rootScope, collaborationAPI) {
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
          collaborationAPI.getRequestMemberships('community', $scope.community._id).then(function(response) {
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
  .directive('communityMembershipRequestsActions', ['$rootScope', 'collaborationAPI', function($rootScope, collaborationAPI) {
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
          collaborationAPI.join('community', $scope.community._id, $scope.user._id).then(function() {
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
          collaborationAPI.cancelRequestMembership('community', $scope.community._id, $scope.user._id).then(function() {
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
  .directive('communityInviteUsers', ['$q', 'collaborationAPI', 'communityService', 'session',
    function($q, collaborationAPI, communityService, session) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '='
      },
      templateUrl: '/views/modules/community/community-invite-users.html',
      link: function($scope, $element) {
        $scope.placeholder = 'User name';
        $scope.displayProperty = 'displayName';
        $scope.running = false;

        $scope.getErrorDiv = function() {
          return $element.find('[error-container]');
        };
        $scope.getRunningDiv = function() {
          return $element.children('.form-container').children('form').find('[running-container]');
        };
        $scope.getButtonContent = function() {
          return $element.children('.form-container').children('form').find('[button-content]');
        };
        $scope.getSuccessDiv = function() {
          return $element.children('.form-container').children('form').find('[success-container]');
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
          $scope.query = query;
          var deferred = $q.defer();
          collaborationAPI.getInvitablePeople('community', $scope.community._id, {search: query, limit: 5}).then(
            function(response) {
              response.data.forEach(function(user) {
                if (user.firstname && user.lastname) {
                  user.displayName = user.firstname + ' ' + user.lastname;
                }
                else {
                  user.displayName = user.emails[0];
                }
                $scope.query = '';
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
          $scope.hideSuccessMessage();
          $scope.hideErrorMessage();
          $scope.noUser = false;
          $scope.invalidUser = false;
          if ($scope.query && $scope.query !== '') {
            $scope.invalidUser = $scope.query;
            $scope.showErrorMessage();
            if (!$scope.users || $scope.users.length === 0) {
              $scope.query = '';
              return;
            }
          } else if (!$scope.users || $scope.users.length === 0) {
            $scope.noUser = true;
            $scope.showErrorMessage();
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
            promises.push(collaborationAPI.requestMembership('community', $scope.community._id, user._id));
          });

          $q.all(promises).then(
            function() {
              $scope.users = [];
              $scope.running = false;
              $scope.hideRunning();
              $scope.showSuccessMessage();
              if ($scope.query && $scope.query !== '') {
                $scope.invalidUser = $scope.query;
                $scope.showErrorMessage();
              }
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
  }])
  .directive('communityActionsToolbar', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '='
      },
      templateUrl: '/views/modules/community/community-actions-toolbar.html'
    };
  })
  .directive('communityButtonEventCreate', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        community: '='
      },
      templateUrl: '/views/modules/community/community-button-event-create.html'
    };
  })
  .controller('communityCalendarController', ['$scope', 'community', 'calendarService', function($scope, community, calendarService) {

    $scope.changeView = function(view, calendar) {
      calendar.fullCalendar('changeView', view);
    };

    $scope.renderCalender = function(calendar) {
      calendar.fullCalendar('render');
    };

    $scope.uiConfig = {
      calendar: {
        height: 450,
        editable: false,
        weekNumbers: true,
        firstDay: 1,
        header: {
          left: 'prev,next today',
          center: 'title',
          right: 'month,agendaWeek,agendaDay'
        }
      }
    };

    function communityEventSource(start, end, timezone, callback) {
      var path = '/calendars/' + community._id + '/events/';
      return calendarService.list(path, start, end, timezone).then(callback);
    }

    $scope.eventSources = [communityEventSource];
  }])
  .controller('communityAStrackerController',
  ['$rootScope', '$scope', '$log', 'AStrackerHelpers', 'communityAPI', 'ASTrackerNotificationService',
    function($rootScope, $scope, $log, AStrackerHelpers, communityAPI, ASTrackerNotificationService) {

      $scope.activityStreams = ASTrackerNotificationService.streams;

      AStrackerHelpers.getActivityStreamsWithUnreadCount('community', function(err, result) {
        if (err) {
          $scope.error = 'Error while getting unread message: ' + err;
          $log.error($scope.error, err);
          return;
        }

        result.forEach(function(element) {
          element.objectType = 'community';
          element.href = '/#/communities/' + element.target._id;
          element.img = '/api/communities/' + element.target._id + '/avatar';
          ASTrackerNotificationService.subscribeToStreamNotification(element.uuid);
          ASTrackerNotificationService.addItem(element);
        });
      });
  }])
  .directive('listCommunityActivityStreams', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/community/community-as-tracker.html'
    };
  });
