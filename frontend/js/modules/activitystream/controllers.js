'use strict';

angular.module('esn.activitystream')
.controller('activitystreamController',
  ['$rootScope', '$scope', 'activitystreamAggregator', 'usSpinnerService', '$alert', 'activityStreamUpdates',
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
      $scope.restActive = false;
      $scope.threads = [];
      $scope.mostRecentActivityID = null;
      aggregator = null;
    };

    $scope.reset();

    $scope.getStreamUpdates = function() {
      if ($scope.restActive) {
        return;
      }
      $scope.restActive = true;
      $scope.updates = [];
      activityStreamUpdates($scope.activitystreamUuid, $scope).then(function() {
      }, function(err) {
      }).finally (function() {
        // we have to plug here the throbber once the websocket stuff is on
        $scope.restActive = false;
        $rootScope.$emit('activitystream:updated', {
          activitystreamUuid: $scope.activitystreamUuid
        });
      });
    };

    function updateMessageList() {
      if ($scope.restActive) {
        return;
      }
      $scope.restActive = true;
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
        $scope.restActive = false;
        usSpinnerService.stop(spinnerKey);
      });
    }

    $scope.loadMoreElements = function() {
      if (!$scope.activitystreamUuid) {
        return;
      }
      if (!aggregator) {
        aggregator = aggregatorService($scope.activitystreamUuid, 25);
      }
      if (!aggregator.endOfStream) {
        updateMessageList();
      }
    };

    $rootScope.$on('activitystream:userUpdateRequest', function(evt, data) {
      if ($scope.activitystreamUuid === data.activitystreamUuid) {
        $scope.getStreamUpdates();
      }
    });
  }]
);
