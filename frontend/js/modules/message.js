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

    return {
      get: get
    };
  }]);
