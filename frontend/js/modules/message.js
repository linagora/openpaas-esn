'use strict';

angular.module('esn.message', ['esn.file', 'esn.maps', 'restangular', 'mgcrea.ngStrap', 'ngAnimate', 'ngSanitize'])
  .controller('messageController', ['$scope', 'messageAPI', '$alert', '$rootScope', 'geoAPI', function($scope, messageAPI, $alert, $rootScope, geoAPI) {

    $scope.rows = 1;
    $scope.position = {};

    $scope.expand = function(event) {
      $scope.rows = 5;
    };

    $scope.shrink = function() {
      return;
    };

    $scope.fillPosition = function() {
      $scope.position.load = true;
      $scope.position.show = true;
      geoAPI.getCurrentPosition().then(function(data) {
        $scope.position.coords = data.coords;
        $scope.position.message = 'Latitude: ' + data.coords.latitude + ', Longitude: ' + data.coords.longitude;
        geoAPI.reverse(data.coords.latitude, data.coords.longitude).then(function(data) {
          $scope.position.message = data.data.display_name || $scope.position.message;
          $scope.position.display_name = data.data.display_name;
        }, function(err) {
        }).finally(function() {
          $scope.position.load = false;
        });
      }, function(err) {
        $scope.position.error = true;
        if (err.error.code === 1) {
          $scope.position.denied = true;
        }
        if (err.error.code === 2) {
          $scope.position.unavailable = true;
        }
      }).finally(function() {
        $scope.position.load = false;
      });
    };

    $scope.removePosition = function() {
      $scope.position = {};
    };

    $scope.sendMessage = function() {
      if (!$scope.whatsupmessage || $scope.whatsupmessage.trim().length === 0) {
        $scope.displayError('You can not say nothing!');
        return;
      }

      if (!$scope.activitystreamUuid) {
        $scope.displayError('You can not post to an unknown domain');
        return;
      }

      var objectType = 'whatsup';
      var data = {
        description: $scope.whatsupmessage
      };

      if ($scope.position.coords) {
        data.position = {
          coords: $scope.position.coords
        }
      }

      if ($scope.position.display_name) {
        data.position.display_name = $scope.position.display_name;
      }

      var target = {
        objectType: 'activitystream',
        id: $scope.activitystreamUuid
      };

      messageAPI.post(objectType, data, [target]).then(
        function(response) {
          $scope.whatsupmessage = '';
          $scope.rows = 1;
          $rootScope.$emit('message:posted', {
            activitystreamUuid: $scope.activitystreamUuid,
            id: response.data._id
          });
        },
        function(err) {
          if (err.data.status === 403) {
            $scope.displayError('You do not have enough rights to write a new message here');
          } else {
            $scope.displayError('Error while sharing your whatsup message');
          }
        }
      ).finally(function() {
          if ($scope.position.coords) {
            $scope.position = {};
          }
        }
      );
    };

    $scope.resetMessage = function() {
      $scope.rows = 1;
      $scope.whatsupmessage = '';
      $scope.removePosition();
    };

    $scope.displayError = function(err) {
      $alert({
        content: err,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '#error',
        duration: '3',
        animation: 'am-fade'
      });
    };
  }])
  .controller('messageCommentController', ['$scope', 'messageAPI', '$alert', '$rootScope', 'geoAPI', function($scope, messageAPI, $alert, $rootScope, geoAPI) {
    $scope.whatsupcomment = '';
    $scope.sending = false;
    $scope.rows = 1;
    $scope.expand = function() {
      $scope.rows = 4;
    };

    $scope.position = {};

    $scope.fillPosition = function() {
      $scope.position.load = true;
      $scope.position.show = true;
      geoAPI.getCurrentPosition().then(function(data) {
        $scope.position.coords = data.coords;
        $scope.position.message = 'Latitude: ' + data.coords.latitude + ', Longitude: ' + data.coords.longitude;
        geoAPI.reverse(data.coords.latitude, data.coords.longitude).then(function(data) {
          $scope.position.message = data.data.display_name || $scope.position.message;
          $scope.position.display_name = data.data.display_name;
        }, function(err) {
        }).finally(function() {
          $scope.position.load = false;
        });
      }, function(err) {
        $scope.position.error = true;
        if (err.error.code === 1) {
          $scope.position.denied = true;
        }
        if (err.error.code === 2) {
          $scope.position.unavailable = true;
        }
      }).finally(function() {
        $scope.position.load = false;
      });
    };

    $scope.removePosition = function() {
      $scope.position = {};
    };

    $scope.shrink = function() {
      return;
    };

    $scope.addComment = function() {
      if ($scope.sending) {
        $scope.displayError('Client problem, unexpected action!');
        return;
      }

      if (!$scope.message) {
        $scope.displayError('Client problem, message is missing!');
        return;
      }

      if (!$scope.whatsupcomment || $scope.whatsupcomment.trim().length === 0) {
        $scope.displayError('You can not say nothing!');
        return;
      }

      var objectType = 'whatsup';
      var data = {
        description: $scope.whatsupcomment
      };
      var inReplyTo = {
        objectType: $scope.message.objectType,
        _id: $scope.message._id
      };

      if ($scope.position.coords) {
        data.position = {
          coords: $scope.position.coords
        }
      }

      if ($scope.position.display_name) {
        data.position.display_name = $scope.position.display_name;
      }

      $scope.sending = true;
      messageAPI.addComment(objectType, data, inReplyTo).then(
        function(response) {
          $scope.sending = false;
          $scope.whatsupcomment = '';
          $scope.shrink();
          $rootScope.$emit('message:comment', {
            id: response.data._id,
            parent: $scope.message
          });
        },
        function(err) {
          $scope.sending = false;
          if (err.data.status === 403) {
            $scope.displayError('You do not have enough rights to write a response here');
          } else {
            $scope.displayError('Error while adding comment');
          }
        }
      ).finally(function() {
        $scope.position = {};
      });
    };

    $scope.resetComment = function() {
      $scope.whatsupcomment = '';
      $scope.rows = 1;
      $scope.removePosition();
    };

    $scope.displayError = function(err) {
      $alert({
        content: err,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '#commenterror',
        duration: '3',
        animation: 'am-fade'
      });
    };

  }])
  .controller('whatsupMessageDisplayController', function($scope, message) {
    $scope.message = message;
  })
  .directive('whatsupMessage', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/templates/whatsupMessage.html'
    };
  })
  .directive('emailMessage', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/templates/emailMessage.html'
    };
  })
  .directive('whatsupEdition', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/whatsup/whatsupEdition.html'
    };
  })
  .directive('whatsupAddComment', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/whatsup/whatsupAddComment.html'
    };
  })
  .directive('messagesDisplay', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        message: '='
      },
      templateUrl: '/views/modules/message/messagesDisplay.html'
    };
  })
  .directive('messageTemplateDisplayer', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        message: '=',
        writable: '='
      },
      templateUrl: '/views/modules/message/messagesTemplateDisplayer.html'
    };
  })
  .directive('messagesThread', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        message: '=',
        activitystreamUuid: '=',
        lastPost: '=',
        writable: '='
      },
      templateUrl: '/views/modules/message/messagesThread.html'
    };
  })
  .directive('messageAttachment', function(contentTypeService) {
    var classes = {
      application: 'fa-file-text',
      image: 'fa-file-image-o',
      video: 'fa-file-video-o',
      'default': 'fa-file-o'
    };
    return {
      restrict: 'E',
      replace: true,
      scope: {
        attachment: '='
      },
      templateUrl: '/views/modules/message/attachments/messageAttachment.html',
      link: function($scope) {
        $scope.getClass = function(contentType) {
          var type = contentTypeService.getType(contentType);
          return classes[type] || classes.default;
        };
      }
    };
  })
  .directive('messageAttachments', function() {
    return {
      restrict: 'E',
      scope: {
        message: '='
      },
      templateUrl: '/views/modules/message/attachments/messageAttachments.html'
    };
  })
  .factory('messageAPI', ['Restangular', function(Restangular) {

    function get(options) {
      if (angular.isString(options)) {
        return Restangular.one('messages', options).get();
      }
      return Restangular.all('messages').getList(options);
    }

    function post(objectType, data, targets) {
      var payload = {};

      payload.object = angular.copy(data);
      payload.object.objectType = objectType;
      payload.targets = targets;

      return Restangular.all('messages').post(payload);
    }

    function addComment(objectType, data, inReplyTo) {
      var payload = {};
      payload.object = angular.copy(data);
      payload.object.objectType = objectType;
      payload.inReplyTo = inReplyTo;

      return Restangular.all('messages').post(payload);
    }

    return {
      get: get,
      post: post,
      addComment: addComment
    };

  }]);
