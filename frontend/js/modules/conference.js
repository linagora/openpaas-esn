'use strict';

angular.module('esn.conference', ['esn.websocket', 'esn.session', 'esn.domain', 'esn.easyrtc', 'esn.authentication'])
  .controller('liveConferenceController', ['$scope', '$log', '$location', 'socket', 'session', 'conferenceAPI', 'domainAPI', 'tokenAPI', 'webrtcFactory', 'conference', function($scope, $log, $location, socket, session, conferenceAPI, domainAPI, tokenAPI, webrtcFactory, conference) {

    $scope.conference = conference;
    $scope.username = session.user._id;
    $scope.webrtcid = '';
    $scope.users = [];
    $scope.attendees = [];
    $scope.easyrtc = webrtcFactory.get();
    $scope.thumbclass = 'conference-video-multi';
    $scope.isFullscreen = false;

    $scope.toggleFullScreen = function() {
      $scope.isFullscreen = !$scope.isFullscreen;
    };

    $scope.$on('$locationChangeStart', function(event, next, current) {
      $scope.easyrtc.leaveRoom(conference._id, function() {
        $log.debug('Left the conference ' + conference._id);
      }, function() {
        $log.error('Error while leaving conference');
      });
    });

    $scope.getName = function(id) {
      if (!id || id === null) {
        return '';
      }

      var filtered = $scope.users.filter(function(entry) {
        return entry._id === id;
      });
      if (filtered && filtered.length === 1) {
        return filtered[0].firstname || filtered[0].lastname || filtered[0].emails[0] || 'No name';
      }
      return 'No name';
    };

    $scope.performCall = function(otherEasyrtcid) {
      $log.debug('Calling ' + otherEasyrtcid);
      $scope.easyrtc.hangupAll();
      var successCB = function() {
        $log.debug('Successfully connected to ' + otherEasyrtcid);
      };
      var failureCB = function() {
        $log.error('Error while connecting to ' + otherEasyrtcid);
      };
      $scope.easyrtc.call(otherEasyrtcid, successCB, failureCB);
    };

    $scope.invite = function(user) {
      $log.debug('Invite user', user);
      conferenceAPI.invite($scope.conference._id, user._id).then(
        function(response) {
          $log.info('User has been invited', response.data);
        },
        function(error) {
          $log.error('Error while inviting user', error.data);
        }
      );
    };

    $scope.loginSuccess = function(easyrtcid) {
      $scope.webrtcid = easyrtcid;
      $scope.$apply();
    };

    $scope.loginFailure = function(errorCode, message) {
      $log.error('Error while connecting to the webrtc signaling service ' + errorCode + ' : ' + message);
    };

    $scope.entryListener = function(entry, roomName) {
      if (entry) {
        $log.debug('Entering room ' + roomName);
      } else {
        $log.debug('Leaving room ' + roomName);
      }
    };

    $scope.roomOccupantListener = function(roomName, data, isPrimary) {
      $scope.easyrtc.setRoomOccupantListener(null); // so we're only called once.
      $log.debug('New user(s) in room ' + roomName);
      $log.debug('Room data ', data);

      var successCB = function() {
        $log.info('Successfully connected to user');
      };
      var failureCB = function() {
        $log.error('Error while connecting to user');
      };

      for (var easyrtcid in data) {
        $log.debug('Calling: ' + $scope.easyrtc.idToName(easyrtcid));
        $scope.easyrtc.call(easyrtcid, successCB, failureCB);
      }
    };

    $scope.connect = function() {
      $scope.easyrtc.setRoomOccupantListener($scope.roomOccupantListener);
      $scope.easyrtc.setRoomEntryListener($scope.entryListener);
      $scope.easyrtc.setDisconnectListener(function() {
        $log.info('Lost connection to signaling server');
      });
      $scope.easyrtc.joinRoom(conference._id, null,
        function() {
          $log.debug('Joined room ' + conference._id);
        },
        function() {
          $log.debug('Error while joining room ' + conference._id);
        }
      );
      $scope.easyrtc.username = $scope.username;
      $scope.attendees[0] = $scope.username;
      $scope.easyrtc.debugPrinter = function(message) {
        $log.debug(message);
      };

      tokenAPI.getNewToken().then(function(response) {
        var data = response.data || {token: ''};
        var options = {query: 'token=' + data.token + '&user=' + session.user._id};
        $scope.easyrtc.setSocketOptions(options);
        $scope.easyrtc.easyApp('OpenPaasRSE', 'video-thumb0', ['video-thumb1', 'video-thumb2', 'video-thumb3', 'video-thumb4', 'video-thumb5', 'video-thumb6', 'video-thumb7', 'video-thumb8'], $scope.loginSuccess, $scope.loginFailure);

        $scope.easyrtc.setOnCall(function(easyrtcid, slot) {
          $scope.attendees[slot + 1] = $scope.easyrtc.idToName(easyrtcid);
          $log.debug('SetOnCall', easyrtcid);
          $scope.$apply();
        });

        $scope.easyrtc.setOnHangup(function(easyrtcid, slot) {
          $log.debug('setOnHangup', easyrtcid);
          $scope.attendees[slot + 1] = null;
          $scope.$apply();
        });
      }, function(error) {
        if (error && error.data) {
          $log.error('Error while getting creating websocket connection', error.data);
        }
      });
    };

    domainAPI.getMembers(session.domain._id).then(
      function(response) {
        $scope.users = response.data;
      },
      function(error) {
        $log.error('Can not get members ' + error);
      }
    );
    $scope.connect();
  }])
  .controller('conferencesController', ['$scope', '$log', '$location', '$timeout', 'conferenceAPI', 'conferences', function($scope, $log, $location, $timeout, conferenceAPI, conferences) {

    $scope.conferences = conferences;

    $scope.create = function() {
      conferenceAPI.create().then(function(response) {
        $location.path('/conferences/' + response.data._id);
      }, function() {
        $location.path('/');
      });
    };

    $scope.join = function(conference) {
      if (!conference) {
        return;
      }
      var id = conference._id || conference;
      $timeout(function() {
        $location.path('/conferences/' + id);
      }, 0);
    };
  }])
  .directive('conferenceDisplay', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/conference/conference.html'
    };
  })
  .directive('conferenceAttendee', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/conference/attendee.html'
    };
  })
  .directive('conferenceAttendeeControlButton', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/conference/control-button.html',
      scope: {
        attendee: '='
      }
    };
  })
  .directive('liveConferenceNotification', ['livenotification', 'notificationService', '$timeout', 'session',
    function(livenotification, notificationService, $timeout, session) {
      return {
        restrict: 'A',
        controller: function($scope) {
          // This is the way pNotify works. We have to declare the stack
          // variable outside of the instanciation because pNotify stocks the
          // state of notifications here.
          var stack_bottomright = {'dir1': 'up', 'dir2': 'left', 'push': 'top'};
          function handleNotification(msg) {
            notificationService.notify({
              title: 'Conference updated !',
              text: msg.message,
              nonblock: {
                nonblock: true,
                nonblock_opacity: 0.2
              },
              addclass: 'stack-bottomright',
              stack: stack_bottomright,
              type: 'info',
              delay: 3000,
              styling: 'fontawesome'
            });
          }

          $timeout(function() {
            livenotification
              .of('/conferences')
              .subscribe($scope.conference._id)
              .onNotification(function(msg) {
                if (msg.user_id !== session.user._id) {
                  handleNotification(msg);
                }
              });
          }, 0);
        }
      };
    }])
  .directive('invitationConferenceNotification', ['livenotification', 'notificationService', '$timeout',
    function(livenotification, notificationService, $timeout) {
      return {
        restrict: 'A',
        controller: function($scope) {
          // This is the way pNotify works. We have to declare the stack
          // variable outside of the instanciation because pNotify stocks the
          // state of notifications here.
          var stack_topright = {'dir1': 'down', 'dir2': 'left', 'push': 'top'};
          function handleNotification(msg) {
            (notificationService.notify({
              title: 'Conference invitation !',
              text: 'Join the conference ?',
              icon: 'fa fa-phone animated tada',
              addclass: 'stack-topright',
              stack: stack_topright,
              hide: false,
              confirm: {
                confirm: true
              },
              styling: 'fontawesome'
            })).get().on('pnotify.confirm', function() {
                $scope.join(msg.conference_id);
              }).on('pnotify.cancel', function() {
                return;
              });
          }

          $timeout(function() {
            livenotification
              .of('/conferences')
              .on('invitation', function(msg) {
                handleNotification(msg);
              });
          }, 0);
        }
      };
    }])
  .factory('conferenceAPI', ['Restangular', function(Restangular) {

    function get(id) {
      return Restangular.one('conferences', id).get();
    }

    function create() {
      var payload = {};
      return Restangular.all('conferences').post(payload);
    }

    function list() {
      return Restangular.all('conferences').getList();
    }

    function join(id) {
      return Restangular.one('conferences', id).one('attendees').put({action: 'join'});
    }

    function leave(id) {
      return Restangular.one('conferences', id).one('attendees').put({action: 'leave'});
    }

    function invite(id, user_id) {
      return Restangular.one('conferences', id).one('attendees', user_id).put();
    }

    return {
      list: list,
      get: get,
      create: create,
      join: join,
      leave: leave,
      invite: invite
    };
  }]);
