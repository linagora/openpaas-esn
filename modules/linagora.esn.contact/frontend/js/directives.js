'use strict';

angular.module('linagora.esn.contact')
  .directive('contactNavbarLink', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/contact/views/partials/contact-navbar-link.html'
    };
  })
  .directive('contactDisplay', function(ContactsHelper) {
    return {
      restrict: 'E',
      scope: {
        'contact': '=',
        'formattedBirthday': '=',
        'defaultAvatar': '='
      },
      templateUrl: '/contact/views/partials/contact-display.html',
      link: function($scope) {

        ContactsHelper.fillScopeContactData($scope, $scope.contact);

        $scope.hasContactInformation = function() {
          return ($scope.contact.emails && $scope.contact.emails.length > 0) ||
                 ($scope.contact.tel && $scope.contact.tel.length > 0) ||
                 ($scope.contact.addresses && $scope.contact.addresses.length > 0) ||
                 ($scope.contact.social && $scope.contact.social.length > 0) ||
                 ($scope.contact.urls && $scope.contact.urls.length > 0);
        };

        $scope.hasProfileInformation = function() {
          return !!($scope.contact.firstName ||
                    $scope.contact.lastName ||
                    $scope.contact.nickname ||
                    $scope.formattedBirthday);
        };

      }
    };
  })
  .directive('contactEditionForm', function(CONTACT_ATTRIBUTES_ORDER) {
    return {
      restrict: 'E',
      scope: {
        'contact': '='
      },
      templateUrl: '/contact/views/partials/contact-edition-form.html',
      link: function($scope) {
        $scope.CONTACT_ATTRIBUTES_ORDER = CONTACT_ATTRIBUTES_ORDER;
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

  .directive('contactListDisplayer', function($rootScope, toggleContactDisplayService, toggleEventService) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-displayer.html',
      link: function($scope) {

        $scope.displayAs = toggleContactDisplayService.getCurrentDisplay();

        toggleEventService.listen($scope, function(evt, value) {
          $scope.displayAs = value;
        });

        $scope.$on('$locationChangeStart', function() {
          toggleContactDisplayService.setCurrentDisplay($scope.displayAs);
        });

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

  .directive('contactListToggle', function(CONTACT_LIST_DISPLAY, SCROLL_EVENTS, $rootScope, toggleContactDisplayService, toggleEventService) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-toggle.html',
      link: function(scope) {

        function isToggleOn(value) {
          return value === CONTACT_LIST_DISPLAY.cards;
        }

        scope.toggleContactDisplay = isToggleOn(toggleContactDisplayService.getCurrentDisplay());

        scope.resetScroll = function() {
          $rootScope.$broadcast(SCROLL_EVENTS.RESET_SCROLL);
        };

        scope.updateDisplay = function(toggleOn) {
          toggleContactDisplayService.setCurrentDisplay(toggleOn ? CONTACT_LIST_DISPLAY.cards : CONTACT_LIST_DISPLAY.list);
          scope.resetScroll();
        };

        toggleEventService.listen(scope, function(evt, value) {
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
  })

  .directive('contactListHeader', function() {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-header.html'
    };
  })

  .directive('contactListSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-subheader.html'
    };
  })

  .directive('contactShowSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-show-subheader.html'
    };
  })

  .directive('contactEditSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-edit-subheader.html'
    };
  });
