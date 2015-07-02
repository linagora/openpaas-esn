'use strict';

angular.module('esn.collaboration', ['restangular', 'esn.notification'])
  .factory('collaborationService', function() {

    function isManager(collaboration, user) {
      return collaboration.creator === user._id;
    }

    return {
      isManager: isManager
    };
  })
  .factory('collaborationAPI', function(Restangular) {
    function getWhereMember(tuple) {
      return Restangular.all('collaborations/membersearch').getList(tuple);
    }

    function getMembers(objectType, id, options) {
      return Restangular.one('collaborations').one(objectType, id).all('members').getList(options);
    }

    function getMember(objectType, id, member) {
      return Restangular.one('collaborations').one(objectType, id).one('members', member).get();
    }

    function getInvitablePeople(objectType, id, options) {
      var query = options || {};
      return Restangular.one('collaborations').one(objectType, id).all('invitablepeople').getList(query);
    }

    function requestMembership(objectType, id, member) {
      return Restangular.one('collaborations').one(objectType, id).one('membership', member).put();
    }

    function cancelRequestMembership(objectType, id, member) {
      return Restangular.one('collaborations').one(objectType, id).one('membership', member).remove();
    }

    function join(objectType, id, member) {
      return Restangular.one('collaborations').one(objectType, id).one('members', member).put();
    }

    function leave(objectType, id, member) {
      return Restangular.one('collaborations').one(objectType, id).one('members', member).remove();
    }

    function getRequestMemberships(objectType, id, options) {
      var query = options || {};
      return Restangular.one('collaborations').one(objectType, id).all('membership').getList(query);
    }

    return {
      getWhereMember: getWhereMember,
      getMembers: getMembers,
      getMember: getMember,
      join: join,
      leave: leave,
      requestMembership: requestMembership,
      cancelRequestMembership: cancelRequestMembership,
      getRequestMemberships: getRequestMemberships,
      getInvitablePeople: getInvitablePeople
    };
  })
  .controller('collaborationListController', function($scope, domain, user) {
    $scope.domain = domain;
    $scope.user = user;
  })
  .directive('collaborationCreateButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/collaboration/collaboration-create-button.html'
    };
  })
  .directive('collaborationsEventListener', function($rootScope, livenotification) {
    return {
      restrict: 'A',
      replace: true,
      link: function($scope) {
        var join = function(data) {
          $rootScope.$emit('collaboration:join', data);
        };

        var leave = function(data) {
          $rootScope.$emit('collaboration:leave', data);
        };

        livenotification('/collaboration').on('join', join);
        livenotification('/collaboration').on('leave', leave);

        $scope.$on('$destroy', function() {
          livenotification('/collaboration').removeListener('join', join);
          livenotification('/collaboration').removeListener('leave', leave);
        });
      }
    };
  })
  .directive('collaborationMembersWidget', function($rootScope, collaborationAPI) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        collaboration: '=',
        objectType: '@',
        objectTypeFilter: '@'
      },
      templateUrl: '/views/modules/collaboration/collaboration-members-widget.html',
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

        var query = { limit: 16 };

        if ($scope.objectTypeFilter) {
          query.objectTypeFilter = $scope.objectTypeFilter;
        }

        $scope.updateMembers = function() {
          collaborationAPI.getMembers($scope.objectType, $scope.collaboration._id, query).then(function(result) {
            var total = parseInt(result.headers('X-ESN-Items-Count'), 10);
            var members = result.data;
            $scope.more = total - members.length;
            $scope.members = sliceMembers(members);
          }, function() {
            $scope.error = true;
          });
        };

        var collaborationJoinRemover = $rootScope.$on('collaboration:join', $scope.updateMembers);
        var collaborationLeaveRemover = $rootScope.$on('collaboration:leave', $scope.updateMembers);
        element.on('$destroy', function() {
          collaborationJoinRemover();
          collaborationLeaveRemover();
        });
        $scope.updateMembers();
      }
    };
  })
  .directive('collaborationMemberAvatar', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        member: '=',
        collaboration: '='
      },
      templateUrl: '/views/modules/collaboration/collaboration-member-avatar.html',
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

        if ($scope.collaboration.creator === $scope.member.user._id) {
          $scope.creator = true;
        }
      }
    };
  })
  .directive('collaborationInviteUsers', function($q, collaborationAPI, collaborationService, session, notificationFactory) {
      return {
        restrict: 'E',
        replace: true,
        scope: {
          objectType: '@',
          collaboration: '='
        },
        templateUrl: '/views/modules/collaboration/collaboration-invite-users.html',
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
            notificationFactory.weakInfo('Invitations have been sent', 'You will be notified when new users join the collaboration.');
          };

          $scope.resetMessages = function() {
            $scope.hideErrorMessage();
          };

          $scope.getInvitablePeople = function(query) {
            $scope.query = query;
            var deferred = $q.defer();
            collaborationAPI.getInvitablePeople($scope.objectType, $scope.collaboration._id, {search: query, limit: 5}).then(
              function(response) {
                var cache = [];
                response.data.forEach(function(user) {
                  if (user.firstname && user.lastname) {
                    user.displayName = user.firstname + ' ' + user.lastname;
                  } else {
                    user.displayName = user.emails[0];
                  }

                  if (cache.indexOf(user.displayName) > -1 && user.displayName !== user.emails[0]) {
                    user.displayName += ' - ' + user.emails[0];
                  }
                  cache.push(user.displayName);

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

            var promises = $scope.users.map(function(user) {
              return collaborationAPI.requestMembership($scope.objectType, $scope.collaboration._id, user._id);
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

          if (collaborationService.isManager($scope.collaboration, session.user)) {
            $element.removeClass('hidden');
          }
        }
      };
    })
  .directive('collaborationMembershipRequestsWidget', function($rootScope, collaborationAPI) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        objectType: '@',
        collaboration: '='
      },
      templateUrl: '/views/modules/collaboration/collaboration-membership-requests-widget.html',
      controller: function($scope) {

        $scope.error = false;
        $scope.loading = false;

        $scope.updateRequests = function() {
          $scope.loading = true;
          $scope.error = false;
          collaborationAPI.getRequestMemberships($scope.objectType, $scope.collaboration._id).then(function(response) {
            $scope.requests = response.data || [];
          }, function(err) {
            $scope.error = err.status;
          }).finally (function() {
            $scope.loading = false;
          });
        };

        $scope.updateRequests();

        var removeRequestEntry = function(event, data) {
          if (!data.collaboration || data.collaboration.id !== $scope.collaboration._id) {
            return;
          }
          $scope.requests = $scope.requests.filter(function(request) {
            return request.user._id !== data.user;
          });
        };

        $rootScope.$on('collaboration:request:declined', removeRequestEntry);
        $rootScope.$on('collaboration:request:accepted', removeRequestEntry);
      }
    };
  })
  .directive('collaborationMembershipRequestsActions', function($rootScope, collaborationAPI) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        objectType: '@',
        collaboration: '=',
        user: '='
      },
      templateUrl: '/views/modules/collaboration/collaboration-membership-requests-actions.html',
      controller: function($scope) {

        $scope.error = false;
        $scope.sending = false;
        $scope.done = false;

        $scope.accept = function() {
          $scope.sending = true;
          $scope.error = false;
          collaborationAPI.join($scope.objectType, $scope.collaboration._id, $scope.user._id).then(function() {
            $scope.done = true;
            $rootScope.$emit('collaboration:request:accepted', {
              collaboration: {objectType: $scope.objectType, id: $scope.collaboration._id},
              user: $scope.user._id
            });
          }, function() {
            $scope.error = true;
          }).finally (function() {
            $scope.sending = false;
          });
        };

        $scope.decline = function() {
          $scope.sending = true;
          $scope.error = false;
          collaborationAPI.cancelRequestMembership($scope.objectType, $scope.collaboration._id, $scope.user._id).then(function() {
            $scope.done = true;
            $rootScope.$emit('collaboration:request:declined', {
              collaboration: {objectType: $scope.objectType, id: $scope.collaboration._id},
              user: $scope.user._id
            });
          }, function() {
            $scope.error = true;
          }).finally (function() {
            $scope.sending = false;
          });
        };
      }
    };
  })
  .controller('collaborationMembersController', function($scope, collaborationAPI, usSpinnerService) {
    $scope.spinnerKey = 'membersSpinner';

    var opts = {
      offset: 0,
      limit: 20,
      objectTypeFilter: $scope.objectTypeFilter
    };

    $scope.total = 0;

    $scope.members = [];
    $scope.restActive = false;
    $scope.error = false;
    $scope.offset = 0;

    function updateMembersList() {
      $scope.error = false;
      if ($scope.restActive) {
        return;
      } else {
        $scope.restActive = true;
        usSpinnerService.spin($scope.spinnerKey);

        collaborationAPI.getMembers($scope.collaborationType, $scope.collaboration._id, opts).then(function(result) {
          $scope.total = parseInt(result.headers('X-ESN-Items-Count'), 10);

          // Loop over member just for adding the `members_count` field required by the community and project template
          var members = result.data.map(function(member) {
            var memberData = member[member.objectType];
            if (memberData && Array.isArray(memberData.members)) {
              member[member.objectType].members_count = memberData.members.length;
            }
            return member;
          });
          $scope.members = $scope.members.concat(members);

          $scope.offset += result.data.length;
          $scope.memberCount = result.data.length;
        }, function() {
          $scope.error = true;
        }).finally (function() {
          $scope.restActive = false;
          usSpinnerService.stop($scope.spinnerKey);
        });
      }
    }

    $scope.init = function() {
      updateMembersList();
    };

    $scope.loadMoreElements = function() {
      if ($scope.offset === 0 || $scope.offset < $scope.total) {
        opts.offset = $scope.offset;
        updateMembersList();
      }
    };


    $scope.init();
  })
  .directive('collaborationMembersList', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        collaboration: '=',
        collaborationType: '@',
        objectTypeFilter: '@',
        memberCount: '=',
        spinnerKey: '@',
        readable: '='
      },
      templateUrl: '/views/modules/collaboration/collaboration-members-list.html'
    };
  });
