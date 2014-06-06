'use strict';

angular.module('esn.message', ['restangular', 'mgcrea.ngStrap', 'ngAnimate'])
  .controller('messageController', ['$scope', 'messageAPI', '$alert', '$rootScope', function($scope, messageAPI, $alert, $rootScope) {

    $scope.rows = 1;

    $scope.expand = function(event) {
      $scope.rows = 5;
    };

    $scope.shrink = function(event) {
      if (!$scope.whatsupmessage) {
        $scope.rows = 1;
      }
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
      var target = {
        objectType: 'activitystream',
        id: $scope.activitystreamUuid
      };

      messageAPI.post(objectType, data, [target]).then(
        function(response) {
          $scope.whatsupmessage = '';
          $scope.rows = 1;
          $alert({
            content: 'Message has been published',
            type: 'success',
            show: true,
            position: 'bottom',
            container: '#error',
            duration: '3',
            animation: 'am-fade'
          });
          $rootScope.$emit('message:posted', {
            activitystreamUuid: $scope.activitystreamUuid,
            id: response.data._id
          });
        },
        function(err) {
          $scope.displayError('Error while sharing your whatsup message');
        }
      );
    };

    $scope.resetMessage = function() {
      $scope.rows = 3;
      $scope.whatsupmessage = '';
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
  .controller('messageCommentController', ['$scope', 'messageAPI', '$alert', '$rootScope', function($scope, messageAPI, $alert, $rootScope) {
    $scope.whatsupcomment = '';
    $scope.sending = false;
    $scope.rows = 1;
    $scope.expand = function() {
      $scope.rows = 4;
    };

    $scope.shrink = function(event) {
      if (!$scope.whatsupcomment) {
        $scope.rows = 1;
      }
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
          $scope.displayError('Error while adding comment');
        }
      );
    };

    $scope.resetComment = function() {
      $scope.whatsupcomment = '';
      $scope.rows = 1;
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
  .directive('whatsupEdition', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/whatsupEdition.html'
    };
  })
  .directive('whatsupAddComment', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/whatsupAddComment.html'
    };
  })
  .directive('whatsupMessage', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        message: '=',
        activitystreamUUID: '='
      },
      templateUrl: '/views/modules/message/whatsupMessage.html'
    };
  })
  .directive('whatsupThread', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        message: '=',
        activitystreamUuid: '='
      },
      templateUrl: '/views/modules/message/whatsupThread.html'
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
