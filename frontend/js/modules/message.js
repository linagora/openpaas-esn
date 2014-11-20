'use strict';

angular.module('esn.message', ['esn.file', 'esn.maps', 'esn.file', 'esn.caldav', 'restangular', 'mgcrea.ngStrap', 'ngAnimate', 'ngSanitize', 'RecursionHelper'])
  .controller('messageEditionController', ['$scope', function($scope) {
    var types = ['whatsup', 'event'];
    $scope.type = types[0];
    $scope.show = function(type) {
      if (types.indexOf(type) >= 0) {
        $scope.type = type;
      } else {
        $scope.type = types[0];
      }
    };
  }])
  .directive('messageEdition', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/messageEdition.html'
    };
  })
  .controller('messageController', ['$scope', '$q', 'messageAPI', '$alert', '$rootScope', 'geoAPI', 'fileAPIService', function($scope, $q, messageAPI, $alert, $rootScope, geoAPI, fileAPIService) {

    $scope.rows = 1;
    $scope.position = {};
    $scope.attachments = [];
    $scope.uploads = [];
    $scope.complete = 0;

    $scope.expand = function(event) {
      $scope.rows = 5;
    };

    $scope.shrink = function() {
      return;
    };

    $scope.onFileSelect = function($files) {
      $scope.attachments = [];
      var done = function() {
        $scope.complete++;
      };

      for (var i = 0; i < $files.length; i++) {
        var defer = $q.defer();
        $scope.uploads.push(defer.promise.then(done));
        $scope.attachments.push({
          progress: 0,
          file: $files[i],
          defer: defer,
          index: i
        });
      }
    };

    $scope.removeFile = function(file) {
      $scope.attachments = $scope.attachments.filter(function(attachment) {
        return attachment.file !== file;
      });
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
        };
      }

      if ($scope.position.display_name) {
        data.position.display_name = $scope.position.display_name;
      }

      var target = {
        objectType: 'activitystream',
        id: $scope.activitystreamUuid
      };

      $q.all($scope.uploads).then(function() {

        var attachments = $scope.attachments.map(function(attachment) {
          var type = attachment.file.type;
          if (!type || type.length === 0) {
            type = 'application/octet-stream';
          }
          return {_id: attachment.stored._id, name: attachment.file.name, contentType: type, length: attachment.file.size};
        });

        messageAPI.post(objectType, data, [target], attachments).then(
          function(response) {
            $scope.whatsupmessage = '';
            $scope.rows = 1;
            $scope.attachments = [];
            $scope.uploads = [];
            $scope.complete = 0;
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
        ).finally (function() {
            if ($scope.position.coords) {
              $scope.position = {};
            }
          }
        );
      });
    };

    $scope.resetMessage = function() {
      $scope.rows = 1;
      $scope.whatsupmessage = '';
      $scope.removePosition();
      $scope.attachments = [];
      $scope.uploads = [];
      $scope.complete = 0;
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
  .controller('messageCommentController', ['$scope', '$q', 'messageAPI', '$alert', '$rootScope', 'geoAPI', function($scope, $q, messageAPI, $alert, $rootScope, geoAPI) {
    $scope.attachments = [];
    $scope.uploads = [];
    $scope.complete = 0;
    $scope.whatsupcomment = '';
    $scope.sending = false;
    $scope.rows = 1;
    $scope.position = {};

    $scope.expand = function() {
      $scope.rows = 4;
    };

    $scope.shrink = function() {
      return;
    };

    $scope.onFileSelect = function($files) {
      $scope.attachments = [];
      var done = function() {
        $scope.complete++;
      };

      for (var i = 0; i < $files.length; i++) {
        var defer = $q.defer();
        $scope.uploads.push(defer.promise.then(done));
        $scope.attachments.push({
          progress: 0,
          file: $files[i],
          defer: defer,
          index: i
        });
      }
    };

    $scope.removeFile = function(file) {
      $scope.attachments = $scope.attachments.filter(function(attachment) {
        return attachment.file !== file;
      });
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
        };
      }

      if ($scope.position.display_name) {
        data.position.display_name = $scope.position.display_name;
      }

      $q.all($scope.uploads).then(function() {

        var attachments = $scope.attachments.map(function(attachment) {
          var type = attachment.file.type;
          if (!type || type.length === 0) {
            type = 'application/octet-stream';
          }
          return {
            _id: attachment.stored._id,
            name: attachment.file.name,
            contentType: type,
            length: attachment.file.size
          };
        });

        $scope.sending = true;
        messageAPI.addComment(objectType, data, inReplyTo, attachments).then(
          function(response) {
            $scope.sending = false;
            $scope.whatsupcomment = '';
            $scope.shrink();
            $scope.attachments = [];
            $scope.uploads = [];
            $scope.complete = 0;
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
      });
    };

    $scope.resetComment = function() {
      $scope.whatsupcomment = '';
      $scope.rows = 1;
      $scope.removePosition();
      $scope.attachments = [];
      $scope.uploads = [];
      $scope.complete = 0;
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
  .controller('whatsupMessageDisplayController', ['$scope', 'message', '$routeParams', function($scope, message, $routeParams) {
    $scope.message = message;
    $scope.parentMessage = true;
    $scope.activitystreamUuid = $routeParams.asuuid;
  }])
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
  .directive('eventMessage', ['caldavAPI', 'moment', function(caldavAPI, moment) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/templates/eventMessage.html',
      link: function(scope, element, attrs) {
        caldavAPI.getEvent(scope.message.eventId)
        .then(function(event) {
          scope.event = event;
          element.find('>div>div.loading').addClass('hidden');
          element.find('>div>div.message').removeClass('hidden');
          scope.event.formattedDate = moment(scope.event.startDate).format('MMMM D, YYYY');
          scope.event.formattedStartTime = moment(scope.event.startDate).format('h');
          scope.event.formattedStartA = moment(scope.event.startDate).format('a');
          scope.event.formattedEndTime = moment(scope.event.endDate).format('h');
          scope.event.formattedEndA = moment(scope.event.endDate).format('a');
        }, function(err) {
          element.find('>div.loading').addClass('hidden');
          element.find('>div.error').removeClass('hidden');
        });
      }
    };
  }])
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
  .directive('messageTemplateDisplayer', ['RecursionHelper', function(RecursionHelper) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        message: '=',
        writable: '=',
        activitystreamUuid: '=',
        lastPost: '=',
        parentMessage: '='
      },
      templateUrl: '/views/modules/message/messagesTemplateDisplayer.html',
      compile: function(element) {
        return RecursionHelper.compile(element, function() {});
      }
    };
  }])
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
  .directive('attachmentIcon', function(contentTypeService) {
    var classes = {
      application: 'fa-file-text',
      image: 'fa-file-image-o',
      video: 'fa-file-video-o',
      'default': 'fa-file-o'
    };
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/attachments/attachmentIcon.html',
      link: function($scope, element, attributes) {
        $scope.class = classes[contentTypeService.getType(attributes.type)] || classes.default;
      }
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
  .directive('messageEditionAttachment', ['$timeout', 'fileAPIService', function($timeout, fileAPIService) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/attachments/messageEditionAttachment.html',
      link: function($scope) {

        $scope.uploading = false;

        $scope.upload = function() {
          $scope.uploading = true;
          $scope.attachment.progress = 0;

          $scope.uploader = fileAPIService.uploadFile($scope.attachment.file, $scope.attachment.file.type, $scope.attachment.file.size)
            .success(function(response) {
              $scope.attachment.progress = 100;
              $scope.attachment.uploaded = true;
              $scope.attachment.stored = response;
              return $scope.attachment.defer.resolve($scope.attachment);
            })
            .error(function(err) {
              return $scope.attachment.defer.reject(err);
            })
            .progress(function(evt) {
              $scope.attachment.progress = parseInt(100.0 * evt.loaded / evt.total);
            })
            .finally (function() {
              $timeout(function() {
                $scope.uploading = false;
              }, 2000);
            });
        };

        $scope.cancel = function() {
          $scope.uploading = false;
          if ($scope.uploader) {
            //$scope.uploader.abort();
          }

          if ($scope.attachment.uploaded) {
            console.log('Need to delete the file');
            $scope.$parent.removeFile($scope.attachment.file);
          }
        };

        $scope.upload();
      }
    };
  }])
  .directive('messageEditionAttachments', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/message/attachments/messageEditionAttachments.html'
    };
  })
  .factory('messageAPI', ['Restangular', function(Restangular) {

    function get(options) {
      if (angular.isString(options)) {
        return Restangular.one('messages', options).get();
      }
      return Restangular.all('messages').getList(options);
    }

    function post(objectType, data, targets, attachments) {
      var payload = {};

      payload.object = angular.copy(data);
      payload.object.objectType = objectType;
      payload.targets = targets;

      if (attachments && angular.isArray(attachments)) {
        payload.object.attachments = attachments;
      }

      return Restangular.all('messages').post(payload);
    }

    function addComment(objectType, data, inReplyTo, attachments) {
      var payload = {};
      payload.object = angular.copy(data);
      payload.object.objectType = objectType;
      payload.inReplyTo = inReplyTo;

      if (attachments && angular.isArray(attachments)) {
        payload.object.attachments = attachments;
      }

      return Restangular.all('messages').post(payload);
    }

    return {
      get: get,
      post: post,
      addComment: addComment
    };

  }]);
