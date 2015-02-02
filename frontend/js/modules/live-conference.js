'use strict';

angular.module('esn.live-conference', ['esn.websocket', 'esn.session', 'esn.domain', 'esn.easyrtc', 'esn.authentication', 'esn.notification'])
  .controller('liveConferenceController', [
    '$scope',
    '$log',
    '$timeout',
    'session',
    'conferenceAPI',
    'domainAPI',
    'easyRTCService',
    'conferenceHelpers',
    'conference',
    function($scope, $log, $timeout, session, conferenceAPI, domainAPI, easyRTCService, conferenceHelpers, conference) {

      $scope.conference = conference;
      $scope.users = [];
      $scope.attendees = [];
      $scope.idToAttendeeNameMap = {};
      $scope.mainVideoId = 'video-thumb0';
      $scope.attendeeVideoIds = [
        'video-thumb0',
        'video-thumb1',
        'video-thumb2',
        'video-thumb3',
        'video-thumb4',
        'video-thumb5',
        'video-thumb6',
        'video-thumb7',
        'video-thumb8'
      ];

      $scope.$on('$locationChangeStart', easyRTCService.leaveRoom(conference));

      $scope.getMainVideoAttendeeIndex = function(mainVideoId) {
        return conferenceHelpers.getMainVideoAttendeeIndexFrom(mainVideoId);
      };

      $scope.streamToMainCanvas = function(index) {
        $scope.mainVideoId = $scope.attendeeVideoIds[index];
      };

      $scope.isMainVideo = function(videoId) {
        return conferenceHelpers.isMainVideo($scope.mainVideoId, videoId);
      };

      $scope.performCall = function(otherEasyrtcid) {
        easyRTCService.performCall(otherEasyrtcid);
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

      domainAPI.getMembers(session.domain._id).then(
        function(response) {
          $scope.users = response.data;
          $scope.idToAttendeeNameMap = conferenceHelpers.mapUserIdToName($scope.users);
        },
        function(error) {
          $log.error('Can not get members ' + error);
        }
      );

      // We must wait for the directive holding the template containing videoIds
      // to be displayed in the browser before using easyRTC.
      var unregister = $scope.$watch(function() {
        return angular.element('#video-thumb0')[0];
      }, function(video) {
        if (video) {
          easyRTCService.connect($scope.conference, $scope.mainVideoId, $scope.attendees);
          unregister();
        }
      });
    }
  ])

  .factory('easyRTCService', ['$rootScope', '$log', 'webrtcFactory', 'tokenAPI', 'session',
  'ioSocketConnection', 'ioConnectionManager', '$timeout',
  function($rootScope, $log, webrtcFactory, tokenAPI, session, ioSocketConnection, ioConnectionManager, $timeout) {
    var easyrtc = webrtcFactory.get();

    function leaveRoom(conference) {
      easyrtc.leaveRoom(conference._id, function() {
        $log.debug('Left the conference ' + conference._id);
        $rootScope.$emit('conference:left', {conference_id: conference._id});
        easyrtc.getLocalStream().stop();
      }, function() {
        $log.error('Error while leaving conference');
      });
    }

    function performCall(otherEasyrtcid) {
      $log.debug('Calling ' + otherEasyrtcid);
      easyrtc.hangupAll();

      function onSuccess() {
        $log.debug('Successfully connected to ' + otherEasyrtcid);
      }

      function onFailure() {
        $log.error('Error while connecting to ' + otherEasyrtcid);
      }

      easyrtc.call(otherEasyrtcid, onSuccess, onFailure);
    }

    function connect(conference, mainVideoId, attendees) {

      function entryListener(entry, roomName) {
        if (entry) {
          $log.debug('Entering room ' + roomName);
        } else {
          $log.debug('Leaving room ' + roomName);
        }
      }

      function roomOccupantListener(roomName, data, isPrimary) {
        easyrtc.setRoomOccupantListener(null); // so we're only called once.
        $log.debug('New user(s) in room ' + roomName);
        $log.debug('Room data ', data);

        function onSuccess() {
          $log.info('Successfully connected to user');
        }

        function onFailure() {
          $log.error('Error while connecting to user');
        }

        for (var easyrtcid in data) {
          $log.debug('Calling: ' + easyrtc.idToName(easyrtcid));
          easyrtc.call(easyrtcid, onSuccess, onFailure);
        }
      }

      easyrtc.setRoomOccupantListener(roomOccupantListener);
      easyrtc.setRoomEntryListener(entryListener);

      easyrtc.setDisconnectListener(function() {
        $log.info('Lost connection to signaling server');
      });

      easyrtc.joinRoom(conference._id, null,
        function() {
          $log.debug('Joined room ' + conference._id);
        },
        function() {
          $log.debug('Error while joining room ' + conference._id);
        }
      );

      easyrtc.username = session.user._id;
      attendees[0] = session.user._id;

      easyrtc.debugPrinter = function(message) {
        $log.debug(message);
      };

      function onWebsocket() {
        var sio = ioSocketConnection.getSio();
        sio.socket = {connected: true};
        easyrtc.useThisSocketConnection(sio);
        function onLoginSuccess(easyrtcid) {
          $log.debug('Successfully logged: ' + easyrtcid);
          $rootScope.$apply();
        }

        function onLoginFailure(errorCode, message) {
          $log.error('Error while connecting to the webrtc signaling service ' + errorCode + ' : ' + message);
        }

        easyrtc.easyApp(
          'OpenPaasRSE',
          mainVideoId,
          [
            'video-thumb1',
            'video-thumb2',
            'video-thumb3',
            'video-thumb4',
            'video-thumb5',
            'video-thumb6',
            'video-thumb7',
            'video-thumb8'
          ],
          onLoginSuccess,
          onLoginFailure);

        easyrtc.setOnCall(function(easyrtcid, slot) {
          attendees[slot + 1] = easyrtc.idToName(easyrtcid);
          $log.debug('SetOnCall', easyrtcid);
          $rootScope.$apply();
        });

        easyrtc.setOnHangup(function(easyrtcid, slot) {
          $log.debug('setOnHangup', easyrtcid);
          attendees[slot + 1] = null;
          $rootScope.$apply();
        });
      }

      if (ioSocketConnection.isConnected()) {
        onWebsocket();
      } else {
        ioSocketConnection.addConnectCallback(onWebsocket);
      }

    }

    function enableMicrophone(muted) {
      easyrtc.enableMicrophone(muted);
    }

    function enableCamera(videoMuted) {
      easyrtc.enableCamera(videoMuted);
    }

    function enableVideo(videoMuted) {
      easyrtc.enableVideo(videoMuted);
    }

    return {
      leaveRoom: leaveRoom,
      performCall: performCall,
      connect: connect,
      enableMicrophone: enableMicrophone,
      enableCamera: enableCamera,
      enableVideo: enableVideo
    };
  }])

  .factory('conferenceHelpers', function() {
    function mapUserIdToName(users) {
      var map = {};
      users.forEach(function(user) {
        var name = user.firstname || user.lastname || user.emails[0] || 'No name';
        map[user._id] = name;
      });
      return map;
    }

    function getMainVideoAttendeeIndexFrom(videoId) {
      return parseInt(videoId.substr(11));
    }

    function isMainVideo(mainVideoId, videoId) {
      return mainVideoId === videoId;
    }

    return {
      mapUserIdToName: mapUserIdToName,
      getMainVideoAttendeeIndexFrom: getMainVideoAttendeeIndexFrom,
      isMainVideo: isMainVideo
    };
  })

  .factory('drawVideo', function($rootScope, $window, $interval) {
    var requestAnimationFrame =
      $window.requestAnimationFrame ||
      $window.mozRequestAnimationFrame ||
      $window.msRequestAnimationFrame ||
      $window.webkitRequestAnimationFrame;

    var VIDEO_FRAME_RATE = 1000 / 30;
    var promise;

    function draw(context, video, width, height) {
      // see https://bugzilla.mozilla.org/show_bug.cgi?id=879717
      // Sometimes Firefox drawImage before it is even available.
      // Thus we ignore this error.
      try {
        context.drawImage(video, 0, 0, width, height);
      } catch (e) {
        if (e.name !== 'NS_ERROR_NOT_AVAILABLE') {
          throw e;
        }
      }

    }

    return function(context, video, width, height) {
      if (promise) {
        $interval.cancel(promise);
      }

      promise = $interval(function() {
        requestAnimationFrame(function() {
          draw(context, video, width, height);
        });
      }, VIDEO_FRAME_RATE, 0, false);
    };
  })

  .directive('conferenceVideo', ['$timeout', '$window', 'drawVideo', function($timeout, $window, drawVideo) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/live-conference/partials/conference-video.html',
      link: function(scope, element) {
        var canvas = {};
        var context = {};
        var mainVideo = {};

        $timeout(function() {
          canvas = element.find('canvas#mainVideoCanvas');
          context = canvas[0].getContext('2d');
          mainVideo = element.find('video#video-thumb0');
          mainVideo.on('loadedmetadata', function() {
            function drawVideoInCancas() {
              canvas[0].width = mainVideo[0].videoWidth;
              canvas[0].height = mainVideo[0].videoHeight;
              drawVideo(context, mainVideo[0], canvas[0].width, canvas[0].height);
            }
            if ($window.mozRequestAnimationFrame) {
              // see https://bugzilla.mozilla.org/show_bug.cgi?id=926753
              // Firefox needs this timeout.
              $timeout(function() {
                drawVideoInCancas();
              }, 500);
            } else {
              drawVideoInCancas();
            }
          });
        }, 1000);

        scope.$watch('mainVideoId', function(newVideoId) {
          // Reject the first watch of the mainVideoId
          // when clicking on a new video, loadedmetadata event is not
          // fired.
          if (!mainVideo[0]) {
            return;
          }
          mainVideo = element.find('video#' + newVideoId);
          canvas[0].width = mainVideo[0].videoWidth;
          canvas[0].height = mainVideo[0].videoHeight;
          drawVideo(context, mainVideo[0], canvas[0].width, canvas[0].height);
        });
      }
    };
  }])

  .directive('conferenceAttendee', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/live-conference/partials/attendee.html'
    };
  })

  .directive('conferenceAttendeeVideo', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/live-conference/partials/attendee-video.html',
      scope: {
        attendee: '=',
        videoId: '@'
      },
      controller: function($scope) {
        $scope.muted = false;
        $scope.mute = function() {
          $scope.muted = !$scope.muted;
        };
      },
      link: function(scope, element) {
        scope.$watch('muted', function() {
          var video = element.find('video');
          video[0].muted = scope.muted;
        });
      }
    };
  })

  .directive('conferenceUserVideo', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/live-conference/partials/user-video.html',
      scope: {
        videoId: '@'
      }
    };
  })

  .directive('conferenceUserControlBar', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/live-conference/partials/user-control-bar.html',
      scope: {
        users: '=',
        easyrtc: '=',
        inviteCall: '='
      },
      controller: function($scope, $window, $aside, easyRTCService) {
        $scope.muted = false;
        $scope.videoMuted = false;

        $scope.toggleSound = function() {
          easyRTCService.enableMicrophone($scope.muted);
          $scope.muted = !$scope.muted;
        };

        $scope.toggleCamera = function() {
          easyRTCService.enableCamera($scope.videoMuted);
          easyRTCService.enableVideo($scope.videoMuted);
          $scope.videoMuted = !$scope.videoMuted;
        };

        $scope.toggleInviteRightBar = function() {
          $aside({
            scope: $scope,
            template: '/views/live-conference/partials/invite-members-aside.html'
          });
        };

        $scope.leaveConference = function() {
          $window.close();
        };
      }
    };
  });
