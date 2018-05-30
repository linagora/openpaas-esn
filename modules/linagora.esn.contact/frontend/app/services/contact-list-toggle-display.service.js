(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactListToggleDisplayService', ContactListToggleDisplayService);

  function ContactListToggleDisplayService(
    $rootScope,
    $cacheFactory,
    ContactListToggleEventService,
    CONTACT_LIST_DISPLAY
  ) {
    var CACHE_KEY = 'contact';
    var TOGGLE_KEY = 'listDisplay';
    var current;

    return {
      _cacheValue: _cacheValue,
      _getCache: _getCache,
      _getCacheValue: _getCacheValue,
      getInitialDisplay: getInitialDisplay,
      getCurrentDisplay: getCurrentDisplay,
      setCurrentDisplay: setCurrentDisplay
    };

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
  }
})(angular);
