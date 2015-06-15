'use strict';

angular.module('linagora.esn.contact')
  .constant('DEFAULT_AVATAR', '/images/user.png')
  .directive('contactNavbarLink', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/contact/views/partials/contact-navbar-link.html'
    };
  })
  .controller('MultiInputGroupController', ['$scope', '$timeout', function($scope, $timeout) {
    function _updateTypes() {
      $scope.newItem.type = $scope.types[$scope.content.length % $scope.types.length];
    }

    function _acceptNew() {
      $scope.content.push($scope.newItem);
      $scope.newItem = {};
      _updateTypes();
    }

    function _acceptRemove($index) {
      $scope.content.splice($index, 1);
      _updateTypes();
    }

    this.createVerifyNewFunction = function(/* valuesToCheck... */) {
      var args = arguments;
      return function() {
        if (Array.prototype.every.call(args, function(arg) { return !!$scope.newItem[arg]; })) {
          _acceptNew();
        }
      };
    };

    this.createVerifyRemoveFunction = function(valueToCheck) {
      return function($index) {
        var item = $scope.content[$index];
        if (!item[valueToCheck]) {
          _acceptRemove($index);
        }
      };
    };

    $scope.$watch('content', _updateTypes);

    $scope.content = [];
    $scope.newItem = {};
  }])
  .directive('multiInputGroup', function() {
    return {
      restrict: 'E',
      scope: {
        content: '=multiInputModel',
        types: '=multiInputTypes',
        inputType: '@multiInputTexttype',
        placeholder: '@multiInputPlaceholder'
      },
      templateUrl: '/contact/views/partials/multi-input-group.html',
      controller: 'MultiInputGroupController',
      link: function(scope, element, attrs, controller) {
        scope.verifyNew = controller.createVerifyNewFunction('value');
        scope.verifyRemove = controller.createVerifyRemoveFunction('value');
      }
    };
  })
  .directive('multiInputGroupAddress', function() {
    return {
      restrict: 'E',
      scope: {
        content: '=multiInputModel',
        types: '=multiInputTypes',
        inputType: '@multiInputTexttype',
        placeholder: '@multiInputPlaceholder'
      },
      templateUrl: '/contact/views/partials/multi-input-group-address.html',
      controller: 'MultiInputGroupController',
      link: function(scope, element, attrs, controller) {
        scope.verifyNew = controller.createVerifyNewFunction('street', 'zip', 'city', 'country');
        scope.verifyRemove = controller.createVerifyRemoveFunction('street');
      }
    };
  })
  .directive('multiInlineEditableInputGroup', function() {
    return {
      restrict: 'E',
      scope: {
        content: '=multiInputModel',
        types: '=multiInputTypes',
        inputType: '@multiInputTexttype',
        placeholder: '@multiInputPlaceholder',
        onSave: '=multiInputOnSave'
      },
      templateUrl: '/contact/views/partials/multi-inline-editable-input-group.html',
      controller: 'MultiInputGroupController',
      link: function(scope, element, attrs, controller) {
        scope.verifyNew = controller.createVerifyNewFunction('value');
        scope.verifyRemove = controller.createVerifyRemoveFunction('value');
      }
    };
  })
  .directive('multiInlineEditableInputGroupAddress', function() {
    return {
      restrict: 'E',
      scope: {
        content: '=multiInputModel',
        types: '=multiInputTypes',
        inputType: '@multiInputTexttype',
        placeholder: '@multiInputPlaceholder',
        onSave: '=multiInputOnSave'
      },
      templateUrl: '/contact/views/partials/multi-inline-editable-input-group-address',
      controller: 'MultiInputGroupController',
      link: function(scope, element, attrs, controller) {
        scope.verifyNew = controller.createVerifyNewFunction('street', 'zip', 'city', 'country');
        scope.verifyRemove = controller.createVerifyRemoveFunction('street');
      }
    };
  })
  .directive('contactDisplay', function() {
    return {
      restrict: 'E',
      scope: {
        'contact': '='
      },
      templateUrl: '/contact/views/partials/contact-display.html'
    };
  })
  .directive('contactDisplayEditable', function(contactsService, notificationFactory) {
    return {
      restrict: 'E',
      scope: {
        'contact': '='
      },
      templateUrl: '/contact/views/partials/contact-display-editable.html',
      link: function(scope) {
        scope.modify = function() {
          var vcard = contactsService.shellToVCARD(scope.contact);
          contactsService.modify(scope.contact.path, vcard, scope.contact.etag).then(function(contact) {
            scope.contact.etag = contact.etag;
            notificationFactory.weakInfo('Contact modification success', 'Successfully modified the contact ' + scope.contact.displayName);
          }).catch (function(err) {
            notificationFactory.weakError('Contact modification failure', err.message);
          });
        };
      }
    };
  })
  .directive('inlineEditableInput', function($timeout) {
    function link(scope, element, attrs, controller) {
      var input = element.find('input');
      var inputGroup = element.find('.input-group');
      scope.showGroupButtons = false;
      var oldValue, hasBeenResized, oldInputGroupWidth;

      function _toggleGroupButtons() {
        scope.showGroupButtons = !scope.showGroupButtons;
      }

      function _resizeInputGroup() {
        if (inputGroup.width() <= 100) {
          inputGroup.width('150px');
          hasBeenResized = true;
        }
      }

      function _resetInputGroup() {
        if (hasBeenResized) {
          inputGroup.width(oldInputGroupWidth + 'px');
          hasBeenResized = false;
        }
      }

      input.bind('focus', function() {
        oldValue = controller.$viewValue;
        oldInputGroupWidth = inputGroup.width();
        _resizeInputGroup();
        $timeout(_toggleGroupButtons, 0);
      });

      input.bind('blur', function() {
        $timeout(function() {
          if (oldValue !== controller.$viewValue) {
            scope.saveInput();
          }
          _resetInputGroup();
          _toggleGroupButtons();
          if (scope.onBlur) {
            scope.onBlur();
          }
        }, 200);
      });

      input.bind('keydown', function(event) {
        var escape = event.which === 27;
        var target = event.target;
        if (escape) {
          $timeout(scope.resetInput, 0);
          target.blur();
          event.preventDefault();
        }
      });

      scope.saveInput = scope.onSave || function() {};

      scope.resetInput = function() {
        controller.$setViewValue(oldValue);
        controller.$render();
      };
    }

    return {
      scope: {
        ngModel: '=',
        type: '@',
        placeholder: '@',
        onSave: '=',
        inputClass: '@',
        onBlur: '='
      },
      require: 'ngModel',
      restrict: 'E',
      templateUrl: '/contact/views/partials/inline-editable-input.html',
      link: link
    };
  })
  .directive('contactListItem', ['contactsService', 'notificationFactory', function(contactsService, notificationFactory) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-list-item.html',
      scope: {
        contact: '=',
        bookId: '='
      },
      link: function($scope) {

        function getFirstValue(property) {
          if (!$scope.contact[property] || !$scope.contact[property][0]) {
            return;
          }
          return $scope.contact[property][0].value;
        }

        $scope.email = getFirstValue('emails');
        $scope.tel = getFirstValue('tel');

        $scope.deleteContact = function() {
          var path = '/addressbooks/' + $scope.bookId + '/contacts';
          contactsService.remove(path, $scope.contact).then(function() {
            $scope.$emit('contact:deleted', $scope.contact);
            notificationFactory.weakInfo('Contact Delete', 'Successfully deleted contact');
          }, function() {
            notificationFactory.weakError('Contact Delete', 'Can not delete contact');
          });
        };
      }
    };
  }])
  .directive('contactPhoto', ['DEFAULT_AVATAR', function(DEFAULT_AVATAR) {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-photo.html',
      scope: {
        contact: '=',
        editable: '@'
      },
      link: function($scope) {
        $scope.defaultAvatar = DEFAULT_AVATAR;
      }
    };
  }]);
