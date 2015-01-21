'use strict';

angular.module('esn.message', ['esn.maps', 'esn.file', 'esn.calendar', 'esn.background', 'esn.notification', 'restangular', 'mgcrea.ngStrap', 'ngAnimate', 'ngSanitize', 'RecursionHelper', 'mgcrea.ngStrap.typeahead'])
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
  .directive('validateOrganizationalTitle', function() {
    return {
      restrict: 'A',
      link: function(scope) {

        scope.validators.push(function() {
          var title = scope.additionalData.title;
          if (!title || title === '') {
            scope.validationError.title = 'A title is required. ';
          }
          else {
            delete scope.validationError.title;
          }
        });
      }
    };
  })
  .directive('organizationalRecipients', ['$q', 'collaborationAPI', function($q, collaborationAPI) {
    return {
      restrict: 'A',
      link: function(scope) {
        scope.validationError.recipients = 'At least one external company is required.';

        scope.getCompanies = function(query) {
          var options = {};
          if (query) {
            options.search = query;
          }
          return collaborationAPI.getExternalCompanies('community', scope.activitystream._id, options);
        };

        scope.validators.push(function() {
          var recipients = scope.additionalData.recipients;
          if (!recipients || recipients.length === 0) {
            scope.validationError.recipients = 'At least one external company is required.';
          }
          else {
            delete scope.validationError.recipients;
          }
        });
      }
    };
  }])
  .controller('messageController', ['$scope', '$q', 'messageAPI', '$alert', '$rootScope', 'geoAPI', 'messageAttachmentHelper', 'backgroundProcessorService', 'notificationFactory', 'fileUploadService', function($scope, $q, messageAPI, $alert, $rootScope, geoAPI, messageAttachmentHelper, backgroundProcessorService, notificationFactory, fileUploadService) {

    $scope.rows = 1;
    $scope.position = {};
    $scope.attachments = [];
    $scope.uploadService = null;
    $scope.validators = [];
    $scope.validationError = {};

    $scope.expand = function(event) {
      if ($scope.rows === 1) {
        $scope.rows = 5;
      }
    };

    $scope.shrink = function() {
      return;
    };

    $scope.onFileSelect = function($files) {
      $scope.expand();
      if (!$scope.uploadService) {
        $scope.uploadService = fileUploadService.get();
      }

      for (var i = 0; i < $files.length; i++) {
        $scope.attachments.push($scope.uploadService.addFile($files[i], true));
      }
    };

    $scope.removeFile = function(file) {
      $scope.attachments = $scope.attachments.filter(function(attachment) {
        return attachment.file !== file;
      });
    };

    $scope.sendMessage = function() {
      if (!$scope.messageContent || $scope.messageContent.trim().length === 0) {
        $scope.displayError('You can not say nothing!');
        return;
      }
      $scope.validators.forEach(function(validator) {
        validator();
      });
      if ($scope.validationError && Object.keys($scope.validationError).length > 0) {
        $scope.displayValidationError();
        return;
      }

      if (!$scope.activitystream || !$scope.activitystream.activity_stream || !$scope.activitystream.activity_stream.uuid) {
        $scope.displayError('You can not post to an unknown activitystream');
        return;
      }

      var objectType = $scope.type;
      var data = {
        description: $scope.messageContent
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
        id: $scope.activitystream.activity_stream.uuid
      };

      function send(objectType, data, targets, attachments) {
        var defer = $q.defer();

        var attachmentsModel = attachments.map(function(attachment) {
          var type = attachment.file.type;
          if (!type || type.length === 0) {
            type = 'application/octet-stream';
          }
          return {_id: attachment.response._id, name: attachment.file.name, contentType: type, length: attachment.file.size};
        });

        var additionalData = $scope.additionalData ? $scope.additionalData : {};
        messageAPI.post(objectType, data, targets, attachmentsModel, additionalData).then(
          function(response) {
            $rootScope.$emit('message:posted', {
              activitystreamUuid: $scope.activitystream.activity_stream.uuid,
              id: response.data._id
            });
            return defer.resolve();
          },
          function(err) {
            return defer.reject(err);
          }
        );
        return defer.promise;
      }

      function clean() {
        $scope.messageContent = '';
        $scope.rows = 1;
        $scope.attachments = [];
        $scope.uploadService = null;
        $scope.additionalData = {};
        if ($scope.position.coords) {
          $scope.position = {};
        }
      }

      if ((!$scope.uploadService) || ($scope.uploadService && $scope.uploadService.isComplete())) {
        return send(objectType, data, [target], $scope.attachments).then(clean, function(err) {
          if (err.data.status === 403) {
            $scope.displayError('You do not have enough rights to write a new message here');
          } else {
            $scope.displayError('Error while sharing your whatsup message');
          }
        });
      } else {
        notificationFactory.weakInfo('Publishing message...', 'Your message is being sent and will be published as soon as possible');
        var done = function(attachments) {
          return send(objectType, data, [target], attachments).then(function() {
            notificationFactory.weakInfo('Message published', 'Your message has been published');
          }, function() {
            notificationFactory.weakInfo('Message error', 'Your message has not been published');
          });
        };
        backgroundProcessorService.add($scope.uploadService.await(done));
        clean();
      }
    };

    $scope.resetMessage = function() {
      $scope.rows = 1;
      $scope.messageContent = '';
      $scope.removePosition();
      $scope.uploadService = null;
      $scope.additionalData = {};
      $q.all(messageAttachmentHelper.deleteAttachments($scope.attachments)).then(function() {
        $scope.attachments = [];
        $scope.uploads = [];
        $scope.complete = 0;
      });
    };

    $scope.displayValidationError = function() {
      var errorMsg = '';
      for (var k in $scope.validationError) {
        errorMsg = errorMsg + $scope.validationError[k] + ' ';
      }
      $scope.displayError(errorMsg);
    };

    $scope.displayError = function(err) {
      $alert({
        content: err,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '.message-panel > .error',
        duration: '3',
        animation: 'am-fade'
      });
    };
  }])
  .controller('messageCommentController', ['$scope', '$q', 'messageAPI', '$alert', '$rootScope', 'geoAPI', 'messageAttachmentHelper', 'backgroundProcessorService', 'notificationFactory', 'fileUploadService', function($scope, $q, messageAPI, $alert, $rootScope, geoAPI, messageAttachmentHelper, backgroundProcessorService, notificationFactory, fileUploadService) {
    $scope.attachments = [];
    $scope.uploadService = null;
    $scope.whatsupcomment = '';
    $scope.sending = false;
    $scope.rows = 1;
    $scope.position = {};

    $scope.expand = function() {
      if ($scope.rows === 1) {
        $scope.rows = 4;
      }
    };

    $scope.shrink = function() {
      return;
    };

    $scope.onFileSelect = function($files) {
      $scope.expand();
      if (!$scope.uploadService) {
        $scope.uploadService = fileUploadService.get();
      }

      for (var i = 0; i < $files.length; i++) {
        $scope.attachments.push($scope.uploadService.addFile($files[i], true));
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

      function comment(objectType, data, inReplyTo, attachments) {
        var defer = $q.defer();

        var attachmentsModel = attachments.map(function(attachment) {
          var type = attachment.file.type;
          if (!type || type.length === 0) {
            type = 'application/octet-stream';
          }
          return {_id: attachment.response._id, name: attachment.file.name, contentType: type, length: attachment.file.size};
        });

        messageAPI.addComment(objectType, data, inReplyTo, attachmentsModel).then(
          function(response) {
            $rootScope.$emit('message:comment', {
              id: response.data._id,
              parent: $scope.message
            });
            return defer.resolve();
          },
          function(err) {
            return defer.reject(err);
          }
        );
        return defer.promise;
      }

      function clean() {
        $scope.whatsupcomment = '';
        $scope.shrink();
        $scope.attachments = [];
        $scope.uploadService = null;
        $scope.sending = false;
      }

      if ((!$scope.uploadService) || ($scope.uploadService && $scope.uploadService.isComplete())) {
        $scope.sending = true;

        return comment(objectType, data, inReplyTo, $scope.attachments).then(clean, function(err) {
          $scope.sending = false;
          if (err.data.status === 403) {
            $scope.displayError('You do not have enough rights to write a response here');
          } else {
            $scope.displayError('Error while adding comment');
          }
        });
      } else {
        notificationFactory.weakInfo('Publishing comment...', 'Your comment is being sent and will be published as soon as possible');
        var done = function(attachments) {
          return comment(objectType, data, inReplyTo, attachments).then(function() {
            notificationFactory.weakInfo('Comment published', 'Your comment has been published');
          }, function() {
            notificationFactory.weakInfo('Comment error', 'Your comment has not been published');
          });
        };
        backgroundProcessorService.add($scope.uploadService.await(done));
        clean();
      }
    };

    $scope.resetComment = function() {
      $scope.whatsupcomment = '';
      $scope.rows = 1;
      $scope.removePosition();
      $q.all(messageAttachmentHelper.deleteAttachments($scope.attachments)).then(function() {
        $scope.attachments = [];
        $scope.uploads = [];
        $scope.complete = 0;
      });
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
  .directive('eventMessage', ['calendarService', 'session', 'moment', function(calendarService, session, moment) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/templates/eventMessage.html',
      link: function($scope, element, attrs) {
        $scope.changeParticipation = function(partstat) {
          var vcalendar = $scope.event.vcalendar;
          var path = $scope.event.path;
          var etag = $scope.event.etag;
          var emails = session.user.emails;

          calendarService.changeParticipation(path, vcalendar, emails, partstat, etag).then(function(shell) {
            $scope.partstat = partstat;
            if (shell) {
              $scope.event = shell;
            }
          });
        };

        // Initialization
        calendarService.getEvent($scope.message.eventId).then(function(event) {
          // Set up dom nodes
          $scope.event = event;
          element.find('>div>div.loading').addClass('hidden');
          element.find('>div>div.message').removeClass('hidden');

          // Load participation status
          var vcalendar = event.vcalendar;
          var emails = session.user.emails;
          var attendees = calendarService.getInvitedAttendees(vcalendar, emails);
          if (attendees.length) {
            $scope.partstat = attendees[0].getParameter('partstat');
          }
        }, function(response) {
          var error = 'Could not retrieve event: ' + response.statusText;
          element.find('>div>.loading').addClass('hidden');
          element.find('>div>.error').text(error).removeClass('hidden');
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
  .directive('organizationalEdition', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/organizational/organizationalEdition.html'
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
        activitystream: '=?',
        lastPost: '=',
        parentMessage: '='
      },
      templateUrl: '/views/modules/message/messagesTemplateDisplayer.html',
      controller: function($scope) {

        if (!$scope.activitystream) {
          var origins = $scope.message.streamOrigins;
          if (origins && origins.length > 0) {
            $scope.activitystream = origins[0];
          }
        }
        if ($scope.activitystream) {
          $scope.writable = $scope.activitystream.writable;
        } else {
          $scope.writable = false;
        }
      },
      compile: function(element) {
        return RecursionHelper.compile(element, function() {});
      }
    };
  }])
  .directive('messagePreviewDisplayer', ['RecursionHelper', function(RecursionHelper) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        message: '='
      },
      templateUrl: '/views/modules/message/messagesPreviewDisplayer.html',
      compile: function(element) {
        return RecursionHelper.compile(element, function() {});
      }
    };
  }])
  .directive('whatsupMessagePreview', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/previews/whatsupMessage.html'
    };
  })
  .directive('emailMessagePreview', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/previews/emailMessage.html'
    };
  })
  .directive('messagePreview', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/previews/defaultMessage.html'
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

        $scope.cancel = function() {
          if ($scope.attachment.uploaded) {
            $scope.$parent.removeFile($scope.attachment.file);
            fileAPIService.remove('files', $scope.attachment.response._id).then(function() {
              $scope.attachment.defer.resolve({status: 'canceled'});
            }, function() {
              $scope.attachment.defer.resolve({status: 'can not delete file'});
            });
          } else if ($scope.attachment.uploading) {
            $scope.attachment.cancel();
            $scope.$parent.removeFile($scope.attachment.file);
            $scope.attachment.defer.resolve({status: 'canceled'});
          }
        };

        $scope.$on('$destroy', function() {
          $scope.cancel();
        });
      }
    };
  }])
  .directive('messageEditionAttachments', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/message/attachments/messageEditionAttachments.html'
    };
  })
  .directive('shareMessageButton', ['$modal', function($modal) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/message/share/share-message-button.html',
      scope: true,
      link: function($scope) {
        $scope.$on('modal.hide', function(evt, modal) {
          $scope.shareModal = null;
          modal.destroy();
        });
        $scope.showShareModal = function() {
          $scope.shareModal = $modal({scope: $scope, template: '/views/modules/message/share/share-message-modal.html'});
        };
      }
    };
  }])
  .directive('shareList', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/message/share/share-list.html'
    };
  })
  .directive('shareTag', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/message/share/share-tag.html'
    };
  })
  .controller('messageShareController', ['$scope', '$q', '$log', '$alert', 'notificationFactory', 'messageAPI', 'userAPI', function($scope, $q, $log, $alert, notificationFactory, messageAPI, userAPI) {

    $scope.sending = false;

    $scope.share = function() {

      if (!$scope.activitystream) {
        $log.debug('activitystream is required');
        return;
      }

      if ($scope.shares.length === 0) {
        $log.debug('At least one share is required');
        return;
      }

      var targets = $scope.shares.map(function(share) {
        return {
          objectType: 'activitystream',
          id: share.uuid
        };
      });

      var resource = {
        objectType: 'activitystream',
        id: $scope.activitystream.activity_stream.uuid
      };

      $scope.sending = true;

      messageAPI.share($scope.message._id, resource, targets).then(function(result) {
        $log.debug('Message has been shared', result.data._id);
        if ($scope.shareModal) {
          $scope.shareModal.hide();
        }
        $scope.messageShared();
      }, function(err) {
        $log.error('Can not share message', err.data);
        $scope.displayError('Error while sharing message');
      }).finally (function() {
        $scope.sending = false;
      });
    };

    $scope.selected = '';
    $scope.shares = [];

    $scope.$on('$typeahead.select', function(value, index) {
      $scope.addTarget(index);
    });

    $scope.getTargets = function(str) {
      return userAPI.getActivityStreams({name: str, writable: true}).then(function(response) {
        return response.data;
      });
    };

    $scope.addTarget = function(selected) {
      $scope.shares.push(selected);
    };

    $scope.messageShared = function() {
      notificationFactory.weakInfo('Message Sharing', 'Message has been shared to communities!');
    };

    $scope.displayError = function(err) {
      $alert({
        content: err,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '#shareerror',
        duration: '3',
        animation: 'am-fade'
      });
    };

  }])
  .factory('messageAttachmentHelper', ['$q', 'fileAPIService', function($q, fileAPIService) {

    function deleteAttachments(attachments) {
      var calls = [];
      if (!attachments || attachments.length === 0) {
        return;
      }
      angular.forEach(attachments, function(attachment) {
        if (attachment.response && attachment.response._id) {
          var defer = $q.defer();
          fileAPIService.remove('files', attachment.response._id).then(function() {
            defer.resolve({status: 'success', _id: attachment.response._id});
          }, function() {
            defer.resolve({status: 'error', _id: attachment.response._id});
          });
          calls.push(defer.promise);
        }
        else if (attachment.uploading) {
          attachment.cancel();
        }
      });
      return calls;
    }

    return {
      deleteAttachments: deleteAttachments
    };
  }])
  .factory('messageAPI', ['Restangular', function(Restangular) {

    function get(options) {
      if (angular.isString(options)) {
        return Restangular.one('messages', options).get();
      }
      return Restangular.all('messages').getList(options);
    }

    function post(objectType, data, targets, attachments, additionalData) {
      var payload = {};

      payload.object = angular.copy(data);
      payload.object.objectType = objectType;
      payload.targets = targets;

      if (attachments && angular.isArray(attachments)) {
        payload.object.attachments = attachments;
      }

      if (additionalData) {
        payload.object.data = angular.copy(additionalData);
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

    function share(id, resource, targets) {
      var payload = {
        resource: resource,
        target: targets
      };
      return Restangular.one('messages', id).all('shares').post(payload);
    }

    return {
      get: get,
      post: post,
      addComment: addComment,
      share: share
    };

  }]);
