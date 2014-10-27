'use strict';

angular.module('esn.core', [])
  .factory('CounterFactory', ['$log', '$timeout', function($log, $timeout) {

    function Counter(initialCount, refreshTimer, refreshFn) {
      this.count = initialCount;
      this.refreshTimer = refreshTimer;
      this.refreshFn = refreshFn;
      this.timer = null;
    }

    Counter.prototype.init = function init() {
      var self = this;
      self.refreshFn()
        .then(function(response) {
          self.count = response.data.unread_count;
          $log.debug('Initial count is ' + response.data.unread_count);
        }, function(err) {
          $log.error('Error getting unread count of user notification: ' + err);
        });
    };

    Counter.prototype.refresh = function refresh() {
      var self = this;
      if (self.timer === null) {
        self.timer = $timeout(function() {
          self.refreshFn()
            .then(function(response) {
              self.count = response.data.unread_count;
              $log.debug('count is ' + response.data.unread_count);
            }, function(err) {
              $log.error('Error getting unread count of user notification: ' + err);
            });
          self.timer = null;
        }, self.refreshTimer);
      } else {
        $log.debug('get unread timer is already up');
      }
    };

    Counter.prototype.decreaseBy = function decreaseBy(number) {
      this.count -= number;
    };

    Counter.prototype.increaseBy = function increaseBy(number) {
      this.count += number;
    };

    return {
      newCounter: function(initialCount, refreshTimer, refreshFn) {
        return new Counter(initialCount, refreshTimer, refreshFn);
      }
    };
  }])
  .controller('selectActiveItem', ['$scope', function($scope) {
    $scope.selected = 1;
    $scope.selectItem = function(index) {
      $scope.selected = index;
    };
  }])
  .filter('bytes', function() {
    return function(bytes, precision) {
      if (bytes === 0) {
        return '0 bytes';
      }

      if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
        return '-';
      }

      if (typeof precision === 'undefined') {
        precision = 1;
      }

      var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
        number = Math.floor(Math.log(bytes) / Math.log(1024)),
        val = (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision);

      return (val.match(/\.0*$/) ? val.substr(0, val.indexOf('.')) : val) + '' + units[number];
    };
  });
