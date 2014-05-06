'use strict';

angular.module('esn.message', ['restangular', 'esn.session', 'mgcrea.ngStrap', 'ngAnimate'])
  .controller('messageController', ['$scope', 'messageAPI', 'session', '$alert', function($scope, $messageAPI, $session, $alert) {
    var initialMessage = 'Hey! what\'s up?';
    $scope.whatsupmessage = initialMessage;

    $scope.sendMessage = function() {
      if (!$scope.whatsupmessage || $scope.whatsupmessage.trim().length === 0) {
        $scope.displayError('You can not say nothing!');
        return;
      }

      if (!$session.domain || !$session.domain.activity_stream || !$session.domain.activity_stream.uuid) {
        $scope.displayError('You can not post to an unknown domain');
        return;
      }

      var objectType = 'whatsup';
      var data = {
        description: $scope.whatsupmessage
      };
      var target = {
        objectType: 'activitystream',
        id: $session.domain.activity_stream.uuid
      };

      $messageAPI.post(objectType, data, [target]).then(
        function(data) {
          $scope.whatsupmessage = initialMessage;
          $alert({
            content: 'Message has been published',
            type: 'success',
            show: true,
            position: 'bottom',
            container: '#error',
            duration: '3',
            animation: 'am-fade'
          });
        },
        function(err) {
          $scope.displayError('Error while sharing your whatsup message');
        }
      );
    };
    $scope.resetMessage = function() {
      $scope.whatsupmessage = initialMessage;
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
  .directive('whatsupEdition', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/message/whatsupEdition.html'
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

    return {
      get: get,
      post: post
    };

  }]);
