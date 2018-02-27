'use strict';

angular.module('linagora.esn.contact')

  .factory('displayContactError', function($alert, esnI18nService) {
    return function(err) {
      $alert({
        content: esnI18nService.translate(err).toString(),
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '.contact-error-container',
        duration: '3',
        animation: 'am-flip-x'
      });
    };
  })

  .factory('ContactListScrollingService', function(CONTACT_SCROLL_EVENTS, $rootScope, $window, sharedContactDataService) {
    return function(element, callback) {

      function updateCategoryLetter(offset) {
        var categories = element.find('.block-header') || [];
        var letter = '';

        categories.each(function(index, element) {
          var letterPosition = element.getElementsByTagName('h2')[0].getBoundingClientRect().bottom;
          if (letterPosition < offset) {
            letter = element.textContent;
          } else {
            return;
          }
        });

        if (sharedContactDataService.categoryLetter !== letter) {
          sharedContactDataService.categoryLetter = letter;
          $rootScope.$broadcast(CONTACT_SCROLL_EVENTS, letter);
        }

        if (typeof callback === 'function') {
          callback();
        }
      }

      function onScroll() {
        var contactHeaderOffset = angular.element.find('contact-list-subheader')[0].getBoundingClientRect().bottom;

        updateCategoryLetter(contactHeaderOffset);
      }

      angular.element($window).scroll(onScroll);

      return {
        unregister: function() {
          angular.element($window).off('scroll', onScroll);
        },
        onScroll: onScroll
      };
    };
  })

  .factory('ContactListToggleEventService', function($rootScope, CONTACT_LIST_DISPLAY_EVENTS) {
    function broadcast(value) {
      $rootScope.$broadcast(CONTACT_LIST_DISPLAY_EVENTS.toggle, value);
    }

    function listen($scope, callback) {
      return $scope.$on(CONTACT_LIST_DISPLAY_EVENTS.toggle, callback);
    }

    return {
      broadcast: broadcast,
      listen: listen
    };
  })

  .factory('ContactListToggleDisplayService', function($rootScope, $cacheFactory, ContactListToggleEventService, CONTACT_LIST_DISPLAY) {
    var CACHE_KEY = 'contact';
    var TOGGLE_KEY = 'listDisplay';

    var current;

    function _getCache() {
      var listDisplayCache = $cacheFactory.get(CACHE_KEY);
      if (!listDisplayCache) {
        listDisplayCache = $cacheFactory(CACHE_KEY);
      }
      return listDisplayCache;
    }

    function _getCacheValue() {
      return _getCache().get(TOGGLE_KEY);
    }

    function _cacheValue(value) {
      _getCache().put(TOGGLE_KEY, value);
    }

    function getInitialDisplay() {
      var listDisplayCache = _getCache();
      return listDisplayCache.get(TOGGLE_KEY) || CONTACT_LIST_DISPLAY.list;
    }

    function getCurrentDisplay() {
      if (!current) {
        current = getInitialDisplay();
      }
      return current;
    }

    function setCurrentDisplay(display) {
      _cacheValue(display);
      current = display;
      ContactListToggleEventService.broadcast(display);
    }

    return {
      _cacheValue: _cacheValue,
      _getCache: _getCache,
      _getCacheValue: _getCacheValue,
      getInitialDisplay: getInitialDisplay,
      getCurrentDisplay: getCurrentDisplay,
      setCurrentDisplay: setCurrentDisplay
    };

  });
