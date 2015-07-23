'use strict';

angular.module('esn.core', [])
  .factory('CounterFactory', function($log, $timeout) {

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
      if (this.count < 0) {
        this.count = 0;
      }
    };

    Counter.prototype.increaseBy = function increaseBy(number) {
      this.count += number;
    };

    return {
      newCounter: function(initialCount, refreshTimer, refreshFn) {
        return new Counter(initialCount, refreshTimer, refreshFn);
      }
    };
  })
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
  })
  .filter('urlencode', function($window) {
    return $window.encodeURIComponent;
  })
  .directive('fallbackSrc', function() {
    return {
      link: function postLink(scope, element, attrs) {
        element.bind('error', function() {
          angular.element(this).attr('src', attrs.fallbackSrc);
        });
      }
    };
  })
  .directive('esnMainNavbar', function($location) {

    function firstPathSegment() {
      return $location.path().replace(/^\//, '').split('/').shift();
    }

    function link(scope, element, attrs) {
      function activateTabItem(segment) {
        element.find('.esn-item[data-esn-path]').removeClass('active');
        if (segment) {
          element.find('.esn-item[data-esn-path="' + segment + '"]').addClass('active');
        }
      }

      scope.$on('$routeChangeSuccess', function() {
        activateTabItem(firstPathSegment());
      });
      activateTabItem(firstPathSegment());
    }

    return {
      restruct: 'E',
      templateUrl: '/views/modules/core/esn-main-navbar.html',
      link: link
    };
  })

  .directive('onFinishRender', function($timeout) {
    return {
      restrict: 'A',
      link: function($scope) {
        if ($scope.$last === true) {
          $timeout(function() {
            $scope.$emit('ngRepeatFinished');
          });
        }
      }
    };
  })

  .constant('routeResolver', {
    session: function(type) {
      return ['session', '$q', function(session, $q) {
        return session.ready.then(function(session) {
          return session[type];
        });
      }];
    },

    api: function(api, method, paramName, target) {
      return [api, '$route', '$location', function(api, $route, $location) {
        var routeId = $route.current.params[paramName || 'id'] || undefined;
        return api[method || 'get'](routeId).then(function(response) {
          return response.data;
        }, function(err) {
          $location.path(target || '/');
        });
      }];
    }
  });
