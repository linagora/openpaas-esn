'use strict';

angular.module('linagora.esn.contact')
  .directive('applicationMenuContact', function(applicationMenuTemplateBuilder, CONTACT_MODULE_METADATA) {
    return {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/contact', { url: CONTACT_MODULE_METADATA.icon }, 'Contacts')
    };
  })
  .directive('contactNavbarLink', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/contact/views/partials/contact-navbar-link.html'
    };
  })
  .directive('contactDisplay', function(ContactsHelper, ContactShellDisplayBuilder, CONTACT_AVATAR_SIZE) {
    return {
      restrict: 'E',
      scope: {
        contact: '='
      },
      templateUrl: '/contact/views/partials/contact-display.html',
      link: function($scope) {

        $scope.displayShell = ContactShellDisplayBuilder.build($scope.contact);
        $scope.avatarSize = CONTACT_AVATAR_SIZE.bigger;
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
                    $scope.contact.birthday);
        };

        $scope.shouldDisplayWork = function() {
          return !!($scope.contact.orgName || $scope.contact.orgRole);
        };
      }
    };
  })
  .directive('contactEditionForm', function(CONTACT_ATTRIBUTES_ORDER, CONTACT_AVATAR_SIZE) {
    return {
      restrict: 'E',
      scope: {
        contact: '=',
        contactState: '@'
      },
      templateUrl: '/contact/views/partials/contact-edition-form.html',
      link: function($scope) {
        $scope.CONTACT_ATTRIBUTES_ORDER = CONTACT_ATTRIBUTES_ORDER;
        $scope.avatarSize = CONTACT_AVATAR_SIZE.bigger;
      }
    };
  })
  .directive('contactListItem', function(CONTACT_AVATAR_SIZE, ContactShellDisplayBuilder) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-item.html',
      scope: {
        contact: '=',
        avatarSize: '@'
      },
      controller: 'contactItemController',
      link: {
        // We do translation in pre-link to execute it before the dynamic directive injection
        pre: function(scope) {
          scope.displayShell = ContactShellDisplayBuilder.build(scope.contact);
          scope.avatarSize = scope.avatarSize ? scope.avatarSize : CONTACT_AVATAR_SIZE.list;
        }
      }
    };
  })

  .directive('contactListCard', function(CONTACT_AVATAR_SIZE, ContactShellDisplayBuilder) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-card.html',
      scope: {
        contact: '='
      },
      controller: 'contactItemController',
      link: function(scope) {
        scope.displayShell = ContactShellDisplayBuilder.build(scope.contact);
        scope.avatarSize = CONTACT_AVATAR_SIZE.cards;
      }
    };
  })

  .directive('contactListDisplayer', function($rootScope, ContactListToggleDisplayService, ContactListToggleEventService) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-displayer.html',
      link: function($scope) {

        $scope.displayAs = ContactListToggleDisplayService.getCurrentDisplay();

        ContactListToggleEventService.listen($scope, function(evt, value) {
          $scope.displayAs = value;
        });

        $scope.$on('$locationChangeStart', function() {
          ContactListToggleDisplayService.setCurrentDisplay($scope.displayAs);
        });

      }
    };
  })

  .directive('contactListItems', function(ContactListScrollingService, CONTACT_EVENTS, $timeout, sharedContactDataService, LETTER_DISPLAY_DURATION) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-items.html',
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
  })

  .directive('contactListCards', function() {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-cards.html'
    };
  })

  .directive('contactCategoryLetter', function() {
    return {
      restrict: 'E',
      template: '{{headerDisplay.categoryLetter}}',
      controller: 'contactCategoryLetterController'
    };
  })

  .directive('contactPhoto', function(CONTACT_DEFAULT_AVATAR, ContactShellDisplayBuilder) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-photo.html',
      scope: {
        contact: '=',
        editable: '@',
        listView: '@',
        avatarSize: '@',
        contactState: '@'
      },
      link: function(scope) {
        scope.defaultAvatar = CONTACT_DEFAULT_AVATAR;
        scope.displayShell = ContactShellDisplayBuilder.build(scope.contact);
      }
    };
  })
  .directive('contactSearchForm', function(SEARCH_INPUT_LIMIT) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-search-form.html',
      link: function(scope) {
        scope.SEARCH_INPUT_LIMIT = SEARCH_INPUT_LIMIT;
      }
    };
  })
  .directive('relaxedDateForBsDatepicker', function(CONTACT_DATE_FORMAT, $dateFormatter) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, controller) {
        element.attr('placeholder', CONTACT_DATE_FORMAT);

        // Change bs-datepick behavior and put the string birthday in input
        scope.$applyAsync(function() {
          controller.$parsers = [];

          controller.$render = function() {
            element.val($dateFormatter.formatDate(controller.$viewValue, CONTACT_DATE_FORMAT));
          };

          if (angular.isString(scope.contact.birthday)) {
            element.val(scope.contact.birthday);
          }
        });
      }
    };
  })

  .directive('contactListToggle', function(CONTACT_LIST_DISPLAY, $rootScope, ContactListToggleDisplayService, ContactListToggleEventService) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-toggle.html',
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

  .directive('contactCreateSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-create-subheader.html'
    };
  })

  .directive('contactEditSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-edit-subheader.html'
    };
  })

  .directive('contactEditActionItem', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/contact/views/menu-items/menu-edit-action.html'
    };
  })

  .directive('contactDeleteActionItem', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/contact/views/menu-items/menu-delete-action.html'
    };
  })
;
