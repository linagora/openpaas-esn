'use strict';

angular.module('linagora.esn.contact')
  .constant('ENTER_KEY', 13)
  .constant('ESCAPE_KEY', 27)
  .directive('contactNavbarLink', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/contact/views/partials/contact-navbar-link.html'
    };
  })
  .controller('MultiInputGroupController', function($scope, $timeout) {
    function _updateTypes() {
      $scope.newItem.type = $scope.types[$scope.content.length % $scope.types.length];
    }

    function _acceptNew() {
      $scope.content.push($scope.newItem);
      $scope.newItem = {};
      _updateTypes();
    }

    function _acceptRemove($index) {
      $scope.content.splice($index, 1);
      _updateTypes();
    }

    this.createVerifyNewFunction = function(/* valuesToCheck... */) {
      var args = arguments;
      return function() {
        if (Array.prototype.every.call(args, function(arg) { return !!$scope.newItem[arg]; })) {
          _acceptNew();
        }
      };
    };

    this.createVerifyRemoveFunction = function(valueToCheck) {
      return function($index) {
        var item = $scope.content[$index];
        if (!item[valueToCheck]) {
          _acceptRemove($index);
        }
      };
    };

    this.createVerifyNewAddressFunction = function() {
      var args = arguments;

      return function() {
        if (Array.prototype.some.call(args, function(arg) { return !!$scope.newItem[arg]; })) {
          _acceptNew();
        }
      };
    };

    this.createVerifyRemoveAddressFunction = function(/* valuesToCheck... */) {
      var args = arguments;
      return function($index) {
       $scope.content.forEach(function(item) {
          if (Array.prototype.every.call(args, function(arg) { return !item[arg]; })) {
            _acceptRemove($index);
          }
        });
      };
    };

    $scope.$watch('content', _updateTypes);

    $scope.content = [];
    $scope.newItem = {};
  })
  .directive('multiInputGroup', function() {
    return {
      restrict: 'E',
      scope: {
        content: '=multiInputModel',
        types: '=multiInputTypes',
        inputType: '@multiInputTexttype',
        placeholder: '@multiInputPlaceholder'
      },
      templateUrl: '/contact/views/partials/multi-input-group.html',
      controller: 'MultiInputGroupController',
      link: function(scope, element, attrs, controller) {
        scope.verifyNew = controller.createVerifyNewFunction('value');
        scope.verifyRemove = controller.createVerifyRemoveFunction('value');
      }
    };
  })
  .directive('multiInputGroupAddress', function() {
    return {
      restrict: 'E',
      scope: {
        content: '=multiInputModel',
        types: '=multiInputTypes',
        inputType: '@multiInputTexttype',
        placeholder: '@multiInputPlaceholder'
      },
      templateUrl: '/contact/views/partials/multi-input-group-address.html',
      controller: 'MultiInputGroupController',
      link: function(scope, element, attrs, controller) {
        scope.verifyNew = controller.createVerifyNewFunction('street', 'zip', 'city', 'country');
        scope.verifyRemove = controller.createVerifyRemoveFunction('street');
      }
    };
  })
  .directive('contactDisplay', function() {
    return {
      restrict: 'E',
      scope: {
        'contact': '=',
        'formattedBirthday': '=',
        'defaultAvatar': '='
      },
      templateUrl: '/contact/views/partials/contact-display.html'
    };
  })
  .directive('contactEditionForm', function() {
    return {
      restrict: 'E',
      scope: {
        'contact': '='
      },
      templateUrl: '/contact/views/partials/contact-edition-form.html'
    };
  })
  .directive('contactListItem', function() {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-item.html',
      scope: {
        contact: '=',
        bookId: '='
      },
      controller: 'contactItemController'
    };
  })

  .directive('contactListCard', function(DEFAULT_AVATAR) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-card.html',
      scope: {
        contact: '=',
        bookId: '='
      },
      controller: 'contactItemController',
      link: function($scope) {
        $scope.defaultAvatar = DEFAULT_AVATAR;
      }
    };
  })

  .directive('contactListDisplayer', function(CONTACT_LIST_DISPLAY, $cacheFactory) {
    var CACHE_KEY = 'contact';
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-displayer.html',
      link: function($scope) {
        var listDisplayCache = $cacheFactory.get(CACHE_KEY);
        if (!listDisplayCache) {
          listDisplayCache = $cacheFactory(CACHE_KEY);
        }
        $scope.$on('$locationChangeStart', function(event, next, current) {
          listDisplayCache.put('listDisplay', $scope.displayAs);
        });
        $scope.displayAs = listDisplayCache.get('listDisplay') || CONTACT_LIST_DISPLAY.list;
      }
    };
  })

  .directive('contactListItems', function() {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-items.html'
    };
  })

  .directive('contactListCards', function() {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-cards.html'
    };
  })

  .directive('contactPhoto', function(DEFAULT_AVATAR) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-photo.html',
      scope: {
        contact: '=',
        editable: '@'
      },
      link: function($scope) {
        $scope.defaultAvatar = DEFAULT_AVATAR;
      }
    };
  })
  .directive('contactSearchForm', function() {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-search-form.html'
    };
  })
  .directive('relaxedDate', function(DATE_FORMAT, $dateParser, $dateFormatter) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, controller) {
        element.attr('placeholder', DATE_FORMAT);

        controller.$parsers.push(function(text) {
          return $dateParser({ format: DATE_FORMAT }).parse(text) || text;
        });
        controller.$formatters.push(function(dateOrText) {
          return $dateFormatter.formatDate(dateOrText, DATE_FORMAT);
        });
      }
    };
  })

  .directive('contactListToggle', function(CONTACT_LIST_DISPLAY, SCROLL_EVENTS, $rootScope) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-toggle.html',
      link: function(scope) {
        scope.resetScroll = function() {
          $rootScope.$broadcast(SCROLL_EVENTS.RESET_SCROLL);
        };
        scope.CONTACT_LIST_DISPLAY = CONTACT_LIST_DISPLAY;
      }
    };
  });
