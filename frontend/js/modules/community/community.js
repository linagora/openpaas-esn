'use strict';

angular.module('esn.community')
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
  .factory('communityAPI', function(esnRestangular, httpConfigurer, $upload) {

    function list(domain, options) {
      var query = options || {};

      query.domain_id = domain;

      return esnRestangular.all('communities').getList(query);
    }

    function get(id) {
      return esnRestangular.one('communities', id).get();
    }

    function del(id) {
      return esnRestangular.one('communities', id).remove();
    }

    function create(body, query) {
      return esnRestangular.all('communities').post(body, query);
    }

    function uploadAvatar(id, blob, mime) {
      return $upload.http({
        method: 'POST',
        url: httpConfigurer.getUrl('/api/communities/' + id + '/avatar'),
        headers: {'Content-Type': mime},
        data: blob,
        params: {mimetype: mime, size: blob.size},
        withCredentials: true
      });
    }

    function getMembers(id) {
      return esnRestangular.one('collaborations').one('community', id).one('members').get();
    }

    function getMember(id, member) {
      return esnRestangular.one('communities', id).one('members', member).get();
    }

    function update(id, body) {
      return esnRestangular.one('communities', id).customPUT(body);
    }

    return {
      list: list,
      get: get,
      del: del,
      create: create,
      uploadAvatar: uploadAvatar,
      getMember: getMember,
      getMembers: getMembers,
      update: update
    };
  })
  .factory('communityCreationService', function($q, $log, $timeout, communityAPI) {

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
      }, 0);

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
  })
  .directive('communityCreateButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/community/community-create-button.html'
    };
  })
  .directive('communityViewSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/community/community-subheader.html'
    };
  })
  .directive('communitiesViewSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/community/communities-subheader.html'
    };
  })
  .directive('communityCreate',
  function(WidgetWizard, selectionService, communityCreationService, $timeout, $state, $alert, $rootScope) {
    function link($scope, element) {
      $scope.wizard = new WidgetWizard([
        '/views/modules/community/community-creation-wizard-1',
        '/views/modules/community/community-creation-wizard-2',
        '/views/modules/community/community-creation-wizard-3'
      ]);
      selectionService.clear();

      $rootScope.$on('modal.show', function() {
        element.find('#title').focus();
      });

      $scope.community = {
        domain_ids: [$scope.domain._id],
        type: 'open'
      };

      $scope.createCommunity = function() {
        $scope.wizard.nextStep();
        $scope.community.avatar = {
          exists: function() { return !!selectionService.getImage(); },
          getBlob: function(mime, callback) { return selectionService.getBlob(mime, callback); }
        };
        $scope.create = { step: 'post', percent: 1 };
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
          $state.go('community.view', { id: id });
        }, 1000);
      }

      function onNotification(notif) {
        if (notif.uploadFailed) {
          $scope.uploadFailed = true;
        } else {
          $scope.create = notif;
        }
      }

      function onFailure() {
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

  })
  .directive('communityDisplay', function(communityAPI, communityService, session, $log, $state) {
    return {
      restrict: 'E',
      scope: {
        community: '=',
        actions: '='
      },
      replace: true,
      templateUrl: '/views/modules/community/community-display.html',
      link: function($scope) {
        function refreshCommunity() {
          communityAPI.get($scope.community._id).then(function(response) {
            $scope.community = response.data;
          }, function(err) {
            $log.error('Error while loading community', err);
          });
        }

        function runAndRefresh(promise) {
          return promise.then(refreshCommunity, refreshCommunity);
        }

        $scope.$watch('community', function() {
          $scope.canJoin = communityService.canJoin($scope.community, session.user);
          $scope.canLeave = communityService.canLeave($scope.community, session.user);
          $scope.canRequestMembership = communityService.canRequestMembership($scope.community, session.user);
          $scope.canCancelMembership = communityService.canCancelRequestMembership($scope.community, session.user);

          $scope.actionVisible = $scope.actions && ($scope.canJoin || $scope.canLeave || $scope.canRequestMembership || $scope.canCancelMembership);
        });

        $scope.join = function() {
          $scope.canJoin = false;
          communityService.join($scope.community, session.user).then(function() {
            $state.go('community.view', { id: $scope.community._id });
          }, refreshCommunity);
        };

        $scope.leave = function() {
          $scope.canLeave = false;
          runAndRefresh(communityService.leave($scope.community, session.user));
        };

        $scope.requestMembership = function() {
          $scope.canRequestMembership = false;
          runAndRefresh(communityService.requestMembership($scope.community, session.user));
        };

        $scope.cancelMembership = function() {
          $scope.canCancelMembership = false;
          runAndRefresh(communityService.cancelRequestMembership($scope.community, session.user));
        };
      }
    };
  })
  .directive('communityButtonJoin', function(communityService) {
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
          .finally(function() {
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
  })
  .directive('communityButtonLeave', function(communityService) {
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
          .finally(function() {
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
  })
  .directive('communityButtonRequestMembership', function(communityService) {
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
            .finally(function() {
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
  })
  .directive('communityButtonCancelRequestMembership', function(communityService) {
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
            .finally(function() {
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
  })
  .directive('ensureUniqueCommunityTitle', function(communityAPI, $q) {
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
  })
  .factory('communityService', function(esnCollaborationClientService, communityAPI, $q) {

    function isManager(community, user) {
      return community.creator === user._id;
    }

    function isMember(community) {
      if (!community || !community.member_status) {
        return false;
      }

      return community.member_status === 'member' || community.member_status === 'indirect';
    }

    function join(community, user) {
      if (isMember(community)) {
        var defer = $q.defer();

        defer.reject('Can not join the community');

        return defer.promise;
      }

      return esnCollaborationClientService.join('community', community._id, user._id);
    }

    function leave(community, user) {
      if (!isMember(community)) {
        var defer = $q.defer();

        defer.reject('Can not leave the community');

        return defer.promise;
      }

      return esnCollaborationClientService.leave('community', community._id, user._id);
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

      return esnCollaborationClientService.requestMembership('community', community._id, user._id);
    }

    function cancelRequestMembership(community, user) {
      if (isMember(community)) {
        var defer = $q.defer();

        defer.reject('User is already a member, can not cancel request membership');

        return defer.promise;
      }

      return esnCollaborationClientService.cancelRequestMembership('community', community._id, user._id);
    }

    function remove(community) {
      return communityAPI.del(community._id);
    }

    return {
      isMember: isMember,
      isManager: isManager,
      join: join,
      leave: leave,
      remove: remove,
      canJoin: canJoin,
      canLeave: canLeave,
      canRead: canRead,
      canRequestMembership: canRequestMembership,
      canCancelRequestMembership: canCancelRequestMembership,
      requestMembership: requestMembership,
      cancelRequestMembership: cancelRequestMembership
    };
  })
  .directive('communityMembershipRequestsWidget', function($rootScope, esnCollaborationClientService) {
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
          esnCollaborationClientService.getRequestMemberships('community', $scope.community._id).then(function(response) {
            $scope.requests = response.data || [];
          }, function() {
            $scope.error = true;
          }).finally(function() {
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
  })
  .directive('communityMembershipRequestsActions', function($rootScope, esnCollaborationClientService) {
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
          esnCollaborationClientService.join('community', $scope.community._id, $scope.user._id).then(function() {
            $scope.done = true;
            $rootScope.$emit('community:request:accepted', {community: $scope.community._id, user: $scope.user._id});
          }, function() {
            $scope.error = true;
          }).finally(function() {
            $scope.sending = false;
          });
        };

        $scope.decline = function() {
          $scope.sending = true;
          $scope.error = false;
          esnCollaborationClientService.cancelRequestMembership('community', $scope.community._id, $scope.user._id).then(function() {
            $scope.done = true;
            $rootScope.$emit('community:request:declined', {community: $scope.community._id, user: $scope.user._id});
          }, function() {
            $scope.error = true;
          }).finally(function() {
            $scope.sending = false;
          });
        };
      }
    };
  })
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
  .directive('communityInviteUsers', function($q, esnCollaborationClientService, communityService, session, userUtils) {
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

          esnCollaborationClientService.getInvitablePeople('community', $scope.community._id, {search: query, limit: 5}).then(
            function(response) {
              response.data.forEach(function(user) {
                user.displayName = userUtils.displayNameOf(user);
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
            promises.push(esnCollaborationClientService.requestMembership('community', $scope.community._id, user._id));
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
  })
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
  .controller('communityAStrackerController',
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
        var registered = ASTrackerNotificationService.subscribeToStreamNotification(element.uuid);

        if (registered) {
          ASTrackerNotificationService.addItem(element);
        }
      });
    });
  })
  .directive('applicationMenuCommunity', function(applicationMenuTemplateBuilder) {
    return {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/community', { name: 'communities' }, 'Communities', 'core.features.application-menu:communities')
    };
  });
