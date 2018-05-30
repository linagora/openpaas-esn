(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactListToggle', contactListToggle);

  function contactListToggle(
    $rootScope,
    ContactListToggleDisplayService,
    ContactListToggleEventService,
    CONTACT_LIST_DISPLAY
  ) {
    return {
      restrict: 'E',
      templateUrl: '/contact/app/contact/list/contact-list-toggle.html',
      link: function(scope) {

        function isToggleOn(value) {
          return value === CONTACT_LIST_DISPLAY.cards;
        }

        scope.toggleContactDisplay = isToggleOn(ContactListToggleDisplayService.getCurrentDisplay());

        scope.updateDisplay = function(toggleOn) {
          ContactListToggleDisplayService.setCurrentDisplay(toggleOn ? CONTACT_LIST_DISPLAY.cards : CONTACT_LIST_DISPLAY.list);
        };

        ContactListToggleEventService.listen(scope, function(evt, value) {
          var toggleValue = isToggleOn(value);

          if (toggleValue === scope.toggleContactDisplay) {
            return;
          }
          scope.toggleContactDisplay = toggleValue;
        });

        scope.$watch('toggleContactDisplay', function(newValue, oldValue) {
          if (oldValue === newValue) {
            return;
          }
          scope.updateDisplay(newValue);
        });

      }
    };
  }
})(angular);
