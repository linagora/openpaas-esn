'use strict';

angular.module('esn.message', ['esn.maps', 'esn.file', 'esn.background', 'esn.notification', 'esn.object-type', 'restangular', 'mgcrea.ngStrap',
'ngAnimate', 'ngSanitize', 'RecursionHelper', 'mgcrea.ngStrap.typeahead',
'esn.poll'])
  .controller('messageEditionController', function($scope) {
    var types = ['whatsup', 'event', 'poll'];
    $scope.type = types[0];
    $scope.show = function(type) {
      if (types.indexOf(type) >= 0) {
        $scope.type = type;
      } else {
        $scope.type = types[0];
      }
    };
  })
  .directive('messageEdition', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/messageEdition.html'
    };
  })
  .controller('messageController', function($scope, $q, messageAPI, $alert, $rootScope, geoAPI, messageAttachmentHelper, backgroundProcessorService, notificationFactory, fileUploadService) {

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
      var data = { description: $scope.messageContent };

      if ($scope.position.coords) {
        data.position = {
          coords: {
            latitude: $scope.position.coords.latitude,
            longitude: $scope.position.coords.longitude
          }
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

        if ($scope.additionalData) {
          data.data = angular.copy($scope.additionalData);
        }
        messageAPI.post(objectType, data, targets, attachmentsModel).then(
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
        $scope.data = {};
        if ($scope.position.coords) {
          $scope.position = {};
        }
      }

      if ((!$scope.uploadService) || ($scope.uploadService && $scope.uploadService.isComplete())) {
        return send(objectType, data, [target], $scope.attachments).then(function() {
          clean();
          $scope.show('whatsup');
        }, function(err) {
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
        $scope.show('whatsup');
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
  })
  .controller('messageCommentController', function($scope, $q, messageAPI, $alert, $rootScope, geoAPI, messageAttachmentHelper, backgroundProcessorService, notificationFactory, fileUploadService) {
    $scope.attachments = [];
    $scope.uploadService = null;
    $scope.commentContent = '';
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

    $scope.addComment = function(objectType) {
      if ($scope.sending) {
        $scope.displayError('Client problem, unexpected action!');
        return;
      }

      if (!$scope.message) {
        $scope.displayError('Client problem, message is missing!');
        return;
      }

      if (!$scope.commentContent || $scope.commentContent.trim().length === 0) {
        $scope.displayError('You can not say nothing!');
        return;
      }

      objectType = objectType || $scope.message.objectType;
      var data = {
        description: $scope.commentContent
      };
      var inReplyTo = {
        objectType: $scope.message.objectType,
        _id: $scope.message._id
      };

      if ($scope.position.coords) {
        data.position = {
          coords: {
            latitude: $scope.position.coords.latitude,
            longitude: $scope.position.coords.longitude
          }
        };
      }

      if ($scope.position.display_name) {
        data.position.display_name = $scope.position.display_name;
      }

      if ($scope.additionalData) {
        data.data = $scope.additionalData;
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

        if ($scope.additionalData) {
          data.data = angular.copy($scope.additionalData);
        }
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
        $scope.commentContent = '';
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
      $scope.commentContent = '';
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
        container: '[error-message-id="' + $scope.message._id + '"]',
        duration: '3',
        animation: 'am-fade'
      });
    };

  })
  .controller('singleMessageDisplayController', function($rootScope, $scope, messageAPI, message, activitystream) {
    $scope.message = message;
    $scope.parentMessage = true;
    $scope.streams = [];
    $scope.activitystream = activitystream;

    function onCommentPosted(evt, msgMeta) {
      if (msgMeta.parent._id !== $scope.message._id) {
        return;
      }

      messageAPI.get(message._id).then(function(response) {
        $scope.message.responses = response.data.responses || $scope.message.responses;
      });
    }

    var unregCmtPostedListener = $rootScope.$on('message:comment', onCommentPosted);

    $scope.$on('$destroy', function() {
      unregCmtPostedListener();
    });

  })
  .directive('whatsupMessage', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/templates/whatsupMessage.html'
    };
  })
  .directive('pollMessage', function($log, session, pollAPI) {
    function link(scope, element, attrs) {
      var results, choices;

      scope.showMeChart = false;
      scope.toggleChartDisplay = function() {
        scope.showMeChart = !scope.showMeChart;
      };

      function refreshScopeData() {
        results = scope.message.pollResults;
        choices = scope.message.pollChoices;
        scope.pollContext = {
          vote: null,
          isCreator: session.user._id === scope.message.author._id,
          hasVoted: results.filter(function(result) {
            return result.actor.objectType === 'user' && result.actor.id === session.user._id;
          }).length > 0
        };
        computeResults();
      }

      function computeResults() {
        scope.pollContext.results = [];
        var cache = {};

        choices.forEach(function(choice) {
          cache[choice.label] = 0;
        });

        results.forEach(function(result) {
          var label = choices[result.vote].label;
          cache[label]++;
        });

        scope.pollContext.results = choices.map(function(choice) {
          return {label: choice.label, votes: cache[choice.label], ratio: cache[choice.label] > 0 ? Math.round((cache[choice.label] * 100) / results.length) : 0};
        });

        scope.pollContext.chart = scope.pollContext.results.map(function(result) {
          return result.votes;
        });

        scope.pollContext.labels = scope.pollContext.results.map(function(result) {
          return result.label;
        });

      }

      function onVoteSuccess(response) {
        $log.debug('Vote succedded');
        scope.pollContext.hasVoted = true;
        scope.message = response.data;
        refreshScopeData();
      }

      function onVoteFailure() {
        $log.debug('Vote failed');
      }

      scope.recordVote = function() {
        var button = element.find('.vote-button');
        var vote = scope.pollContext.vote;

        if (vote === null || !choices[vote]) {
          return $log.warn('Cannot vote: vote is invalid ' + vote);
        }

        button.attr('disabled', 'true');
        pollAPI.vote(scope.message._id, vote)
        .then(onVoteSuccess, onVoteFailure)
        .finally (function() {
          button.removeAttr('disabled');
        });
      };

      refreshScopeData();
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/templates/pollMessage.html',
      link: link
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
  .directive('pollEdition', function() {
    function link(scope, element, attrs) {
      scope.additionalData = {
        pollChoices: [
          {label: ''},
          {label: ''}
        ]
      };

      scope.validators.push(function() {
        var choices = scope.additionalData.pollChoices.filter(function(choice) {
          return choice.label && choice.label.length;
        });
        var choicesMap = {};
        var hasDuplicates = false;
        choices.forEach(function(element) {
          if (element.label in choicesMap) {
            hasDuplicates = true;
          }
          choicesMap[element.label] = true;
        });
        if (!choices || choices.length < 2) {
          scope.validationError.title = 'Your poll should contain at least two choices.';
        } else if (!scope.messageContent || !scope.messageContent.length) {
          scope.validationError.title = 'Your poll should have a description.';
        } else if (hasDuplicates) {
          scope.validationError.title = 'Your poll has duplicated choices.';
        } else {
          delete scope.validationError.title;
        }
      });

      scope.appendChoice = function() {
        scope.additionalData.pollChoices.push({label: ''});
      };
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/poll/pollEdition.html',
      link: link
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
  .directive('messageTemplateDisplayer', function(RecursionHelper) {
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
  })
  .directive('messagePreviewDisplayer', function(RecursionHelper) {
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
  })
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
  .directive('pollMessagePreview', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/previews/pollMessage.html'
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
  .directive('messageEditionAttachment', function($timeout, fileAPIService) {
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
  })
  .directive('messageEditionAttachments', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/message/attachments/messageEditionAttachments.html'
    };
  })
  .directive('shareMessageButton', function($modal) {
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
  })
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
  .controller('messageShareController', function($scope, $q, $log, $alert, notificationFactory, messageAPI, userAPI) {

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

    function isAlreadyInShares(target) {
      return $scope.shares.some(function(share) {
        return share.uuid === target.uuid;
      });
    }

    function isCurrentActivityStream(target) {
      return target.uuid === $scope.activitystream.activity_stream.uuid;
    }

    function isAlreadyShared(target) {
      return $scope.message.copyOf &&
        $scope.message.copyOf.target &&
        $scope.message.copyOf.target.some(function(shared) {
          return shared.id === target.uuid;
        });
    }

    $scope.getTargets = function(str) {
      return userAPI.getActivityStreams({name: str, writable: true}).then(function(response) {
        return response.data.filter(function(target) {
          return !isAlreadyInShares(target) && !isCurrentActivityStream(target);
        });
      });
    };

    $scope.addTarget = function(selected) {
      if (isAlreadyInShares(selected) || isCurrentActivityStream(selected)) {
        return;
      }

      if (isAlreadyShared(selected)) {
        selected.already = true;
      }
      $scope.shares.push(selected);
    };

    $scope.removeShare = function(target) {
      $scope.shares = $scope.shares.filter(function(share) {
        return share.uuid !== target.uuid;
      });
    };

    $scope.messageShared = function() {
      notificationFactory.weakInfo('Message Sharing', 'Message has been shared!');
      $scope.$emit('message:shared', {
        message: $scope.message,
        shares: $scope.shares
      });
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

  })
  .factory('messageAttachmentHelper', function($q, fileAPIService) {

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
  })
  .factory('messageAPI', function(Restangular) {

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

  })
  .directive('sharedFrom', function(activitystreamAPI, objectTypeAdapter) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/message/share/shared-from.html',
      link: function(scope) {
        if (scope.message && scope.message.copyOf && scope.message.copyOf.origin) {
          activitystreamAPI.getResource(scope.message.copyOf.origin.resource.id).then(
            function(response) {
              var collaboration = response.data;
              collaboration.object.objectType = collaboration.objectType;
              scope.sharedFrom = objectTypeAdapter.adapt(collaboration.object);
            },
            function(error) {
              scope.sharedFromError = error.details || error;
            });
        }
      }
    };
  })
  .directive('sharedTo', function(activitystreamAPI, messageAPI, objectTypeAdapter, $q) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/message/share/shared-to.html',
      link: function(scope) {

        function updateShareTargets(target) {
          if (!target) {
            return;
          }

          var cache = [];
          var targets = [];
          target.forEach(function(target) {
            if (cache.indexOf(target.id) === -1) {
              cache.push(target.id);
              targets.push(target);
            }
          });

          var collaborations = [];
          var restCalls = targets.map(function(target) {
            return activitystreamAPI.getResource(target.id).then(
              function(response) {
                collaborations.push(response.data);
              },
              function(error) {
                scope.sharedToError = error.details || error;
              });
          });
          $q.all(restCalls).then(function() {
            scope.shareTargets = collaborations.map(function(collaboration) {
              collaboration.object.objectType = collaboration.objectType;
              return objectTypeAdapter.adapt(collaboration.object);
            });
          },
          function(error) {
            scope.sharedToError = error.details || error;
          });
        }

        if (scope.message && scope.message.copyOf && scope.message.copyOf.target) {
          updateShareTargets(scope.message.copyOf.target);
        } else {
          scope.shareTargets = [];
        }

        scope.$on('message:shared', function(evt, data) {
          if (data.message._id === scope.message._id) {
            messageAPI.get(data.message._id).then(function(response) {
              if (response.data.copyOf) {
                scope.message.copyOf = response.data.copyOf;
                updateShareTargets(scope.message.copyOf.target);
              }
            });
          }
        });
      }
    };
  })
  .directive('messageShared', function () {
    return {
      restrict: 'E',
      scope: {
        message: '='
      },
      templateUrl: '/views/modules/message/templates/includes/shareMessage.html'
    };
  })
  .directive('messageOembeds', function () {
    return {
      restrict: 'E',
      scope: {
        message: '='
      },
      templateUrl: '/views/modules/message/templates/includes/oembed.html'
    };
  })
  .directive('messageDateLink', function () {
    return {
      restrict: 'E',
      scope: {
        'message': '=',
        'activitystream': '='
      },
      templateUrl: '/views/modules/message/templates/includes/dateLink.html'
    };
  })
  .directive('messageBottomLinks', function() {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: '/views/modules/message/templates/includes/messagesBottomLinks.html'
    };
  })
  .directive('messageComments', function () {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: '/views/modules/message/templates/includes/comments.html'
    };
  })
  ;
