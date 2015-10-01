'use strict';

angular.module('linagora.esn.contact')
  .directive('contactMailtoAction', function($window, $timeout) {
    function link($scope) {
     $scope.mailto = function () {
       var oldURL = $window.location.href;
       $window.location.href = 'mailto:' + $scope.$parent.email;

       $timeout(function() {
         $window.location.href = oldURL;
       }, 100);
     };
    }
    return {
     replace: true,
     restrict: 'E',
     templateUrl: '/contact/views/partials/contact-mailto-action.html',
     link: link
    };
  })
  .directive('contactNavbarLink', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/contact/views/partials/contact-navbar-link.html'
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
      templateUrl: '/contact/views/partials/contact-edition-form.html',
      link: function(scope, element) {
        // remove placeholder of the bs-datepicker
        var datepicker = element.find('input[bs-datepicker]');
        datepicker.removeAttr('placeholder');
      }
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

  .directive('contactListCard', function(CONTACT_DEFAULT_AVATAR) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-card.html',
      scope: {
        contact: '=',
        bookId: '='
      },
      controller: 'contactItemController',
      link: function($scope) {
        $scope.defaultAvatar = CONTACT_DEFAULT_AVATAR;
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

  .directive('contactPhoto', function(CONTACT_DEFAULT_AVATAR) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-photo.html',
      scope: {
        contact: '=',
        editable: '@',
        listView: '@'
      },
      link: function($scope) {
        $scope.defaultAvatar = CONTACT_DEFAULT_AVATAR;
      }
    };
  })
  .directive('contactSearchForm', function() {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-search-form.html'
    };
  })
  .directive('relaxedDate', function(CONTACT_DATE_FORMAT, $dateParser, $dateFormatter) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, controller) {
        element.attr('placeholder', CONTACT_DATE_FORMAT);

        controller.$parsers.push(function(text) {
          return $dateParser({ format: CONTACT_DATE_FORMAT }).parse(text) || text;
        });
        controller.$formatters.push(function(dateOrText) {
          return $dateFormatter.formatDate(dateOrText, CONTACT_DATE_FORMAT);
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
