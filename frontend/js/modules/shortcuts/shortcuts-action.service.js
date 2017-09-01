(function(angular) {
  'use strict';

  angular.module('esn.shortcuts')
    .factory('esnShortcutsAction', esnShortcutsAction);

    function esnShortcutsAction() {
      return {
        clickOn: clickOn,
        focusOn: focusOn
      };

      function clickOn(elementSelector) {
        return function() {
          angular.element(elementSelector).click();
        };
      }

      function focusOn(elementSelector) {
        return function() {
          angular.element(elementSelector).focus();
        };
      }
    }
})(angular);
