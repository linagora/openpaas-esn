(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxMakeSelectable', function($rootScope, INBOX_EVENTS) {
      return function(prototype) {
        Object.defineProperties(prototype, {
          selectable: {
            value: true,
            enumerable: true,
            writable: false
          },
          selected: {
            enumerable: true,
            configurable: true,
            get: function() { return !!this._selected; },
            set: function(selected) {
              if (!!this._selected !== selected) {
                this._selected = selected;

                $rootScope.$broadcast(INBOX_EVENTS.ITEM_SELECTION_CHANGED, this);
              }
            }
          }
        });

        return prototype;
      };
    });

})();
