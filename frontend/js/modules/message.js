'use strict';

angular.module('esn.message', ['restangular'])
  .controller('messageController', function($scope) {
    $scope.whatsupmessage = 'Hey ! what\'s up ?';
  })
  .directive('whatsupEdition', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/widgets/message/whatsupEdition.html'
    };
  })
  .factory('messageAPI', ['Restangular', function(Restangular) {

    function get() {
      return Restangular.one('messages').get();
    }

    function post(objectType, data, targets) {
      var payload = {
        object: {
          objectType: objectType,
          description: data
        },
        targets: targets
      };

      return Restangular.all('api/messages').post(payload);
    }

    return {
      get: get,
      post: post
    };

  }]);
