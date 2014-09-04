'use strict';

angular.module('esn.conference', ['restangular'])
  .controller('conferencesController', ['$scope', '$log', '$location', '$window', '$timeout', 'conferenceAPI', 'conferences', function($scope, $log, $location, $window, $timeout, conferenceAPI, conferences) {

    $scope.conferences = conferences;

    $scope.create = function() {
      conferenceAPI.create().then(function(response) {
        $window.open('/conferences/' + response.data._id, 'Conference', 'menubar=no,location=no,resizable=yes,scrollbar=no,status=no');
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
        $window.open('/conferences/' + id, 'Conference', 'menubar=no,location=no,resizable=yes,scrollbar=no,status=no');
      }, 0);
    };
  }])

  .directive('conferenceDisplay', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/esn/partials/conferences/conference-display.html'
    };
  })

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
