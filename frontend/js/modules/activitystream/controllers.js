'use strict';

angular.module('esn.activitystream')
.controller('activitystreamController',
  ['$rootScope', '$scope', 'activitystreamAggregatorCreator', 'usSpinnerService', '$alert', 'activityStreamUpdates',
  function($rootScope, $scope, aggregatorService,  usSpinnerService, alert, activityStreamUpdates) {

    var spinnerKey = 'activityStreamSpinner', aggregator;

    $scope.displayError = function(err) {
      alert({
        content: err,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '#activitystreamerror',
        duration: '3',
        animation: 'am-fade'
      });
    };

    $scope.reset = function() {
      $scope.restActive = {};
      $scope.updateMessagesActive = false;
      $scope.threads = [];
      $scope.mostRecentActivityID = null;
      aggregator = null;
    };

    $scope.reset();

    $scope.getStreamUpdates = function(streamUuid) {
      if ($scope.restActive[streamUuid]) {
        return;
      }
      $scope.restActive[streamUuid] = true;
      $scope.updates = [];
      activityStreamUpdates(streamUuid, $scope).then(function() {
      }, function(err) {
      }).finally (function() {
        // we have to plug here the throbber once the websocket stuff is on
        $scope.restActive[streamUuid] = false;
        $rootScope.$emit('activitystream:updated', {
          activitystreamUuid: streamUuid
        });
      });
    };

    function updateMessageList() {
      if ($scope.updateMessagesActive) {
        return;
      }
      $scope.updateMessagesActive = true;
      usSpinnerService.spin(spinnerKey);

      aggregator.loadMoreElements(function(error, items) {
        if (error) {
          $scope.displayError('Error while retrieving messages. ' + error);
        }
        else {
          for (var i = 0; i < items.length; i++) {
            if (!$scope.mostRecentActivityID) {
              $scope.mostRecentActivityID = items[i]._id;
            }
            $scope.threads.push(items[i].object);
          }
        }
        $scope.updateMessagesActive = false;
        usSpinnerService.stop(spinnerKey);
      });
    }

    $scope.loadMoreElements = function() {
      if (!$scope.streams || $scope.streams.length === 0) {
        return;
      }
      if (!aggregator) {
        aggregator = aggregatorService($scope.streams, 25);
      }
      if (!aggregator.endOfStream) {
        updateMessageList();
      }
    };

    $rootScope.$on('activitystream:userUpdateRequest', function(evt, data) {
      if ($scope.streams.indexOf(data.activitystreamUuid) !== -1) {
        $scope.getStreamUpdates(data.activitystreamUuid);
      }
    });
  }]
);
