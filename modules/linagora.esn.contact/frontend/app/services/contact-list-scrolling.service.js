(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactListScrollingService', ContactListScrollingService);

  function ContactListScrollingService(
    $rootScope,
    $window,
    sharedContactDataService,
    CONTACT_SCROLL_EVENTS
  ) {
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
  }
})(angular);
