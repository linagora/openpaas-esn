'use strict';

angular.module('esn.core', ['esn.lodash-wrapper', 'esn.email-addresses-wrapper'])
  .config(function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|skype):/);
  })
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
        .then(function(count) {
          self.count = count;
          $log.debug('Initial count is ' + count);
        }, function(err) {
          $log.error('Error getting unread count of user notification: ' + err);
        });
    };

    Counter.prototype.refresh = function refresh() {
      var self = this;
      if (self.timer === null) {
        self.timer = $timeout(function() {
          self.refreshFn()
            .then(function(count) {
              self.count = count;
              $log.debug('count is ' + count);
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
  .filter('prefixLink', function() {
    var linkTypes = {
      HTTP: {
        pattern: /^https?:\/\//,
        prefix: 'http://'
      },
      SKYPE: {
        pattern: /^skype:/,
        prefix: 'skype:'
      },
      TWITTER: {
        pattern: /https?:\/\/twitter\.com\/.*?$/,
        prefix: 'http://twitter.com/'
      }
    };
    return function(input, type) {
      var linkType = linkTypes[String(type).toUpperCase()];
      if (linkType && !linkType.pattern.test(input)) {
        input = linkType.prefix + input;
      }
      return input;
    };
  })

  .filter('maxPlus', function() {
    return function(input, maxValue) {
      return input > maxValue ? maxValue + '+' : input;
    };
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
      return ['session', '$q', function(session) {
        return session.ready.then(function(session) {
          return session[type];
        });
      }];
    },

    api: function(api, method, paramName, target) {
      return [api, '$stateParams', '$location', function(api, $stateParams, $location) {
        var routeId = $stateParams[paramName || 'id'] || undefined;
        return api[method || 'get'](routeId).then(function(response) {
          return response.data;
        }, function() {
          $location.path(target || '/');
        });
      }];
    }
  })

  .service('emailService', function(emailAddresses) {
    function isValidEmail(email) {
      return !!emailAddresses.parseOneAddress(email);
    }

    return {
      isValidEmail: isValidEmail
    };
  })

  .directive('clickOutside', function($document) {
    return {
      restrict: 'A',
      scope: {
        clickOutside: '&'
      },
      link: function(scope, element) {
        $document.on('click', function(event) {
          if (element !== event.target && !element[0].contains(event.target)) {
            scope.$apply(function() {
              scope.$eval(scope.clickOutside);
            });
          }
        });
      }
    };
  })

  .factory('esnWithPromiseResult', function(_) {
    return withPromiseResult;

    function buildThenCallback(arg, callback) {
      return callback ? _.partialRight.apply(_, [callback].concat(arg)) : null;
    }

    function withPromiseResult(promise, successCallback, errorCallback) {
      return function() {
        var args = Array.prototype.slice.call(arguments);

        return promise.then(buildThenCallback(args, successCallback), buildThenCallback(args, errorCallback));
      };
    }
  })

  .factory('navigateTo', function($window) {
    return function(url) {
      $window.location = url;
    };
  })
  /* global DOMPurify: false */
  .filter('esnDomPurify', function($sce) {
    return function(dirty) {
      DOMPurify.addHook('afterSanitizeAttributes', function(node) {
        // set all elements owning target to target=_blank
        if ('href' in node) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'nofollow noopener');
        }
      });

      return $sce.trustAsHtml(DOMPurify.sanitize(dirty, {ADD_ATTR: ['target'], FORBID_TAGS: ['style', 'input', 'form']}));
    };
  });
