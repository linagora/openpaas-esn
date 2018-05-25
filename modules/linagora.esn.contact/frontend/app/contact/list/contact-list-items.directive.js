(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .directive('contactListItems', contactListItems);

  function contactListItems(
    $timeout,
    ContactListScrollingService,
    sharedContactDataService,
    CONTACT_EVENTS,
    LETTER_DISPLAY_DURATION
  ) {
    return {
      restrict: 'E',
      templateUrl: '/contact/app/contact/list/contact-list-items.html',
      link: function(scope, element) {
        var timeoutPromise;

        scope.headerDisplay = {
          letterExists: false
        };

        function toggleMobileLetter() {
          if (sharedContactDataService.categoryLetter) {
            scope.headerDisplay.mobileLetterVisibility = true;
            $timeout.cancel(timeoutPromise);
            timeoutPromise = $timeout(function() {
              scope.headerDisplay.mobileLetterVisibility = false;
            }, LETTER_DISPLAY_DURATION);
          } else {
            scope.headerDisplay.mobileLetterVisibility = false;
          }
        }
        var listScroller = ContactListScrollingService(element, toggleMobileLetter);

        function updateLetter() {
          //We need to wait the contact list updated
          $timeout(listScroller.onScroll, 500);
        }

        angular.forEach(CONTACT_EVENTS, function(event) {
          scope.$on(event, updateLetter);
        });

        scope.$on('$destroy', listScroller.unregister);
      }
    };
  }
})(angular);
