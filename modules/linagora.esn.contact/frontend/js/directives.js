'use strict';

angular.module('linagora.esn.contact')
  .constant('ENTER_KEY', 13)
  .constant('ESCAPE_KEY', 27)
  .directive('contactNavbarLink', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/contact/views/partials/contact-navbar-link.html'
    };
  })
  .controller('MultiInputGroupController', function($scope, $timeout) {
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

    this.createVerifyNewAddressFunction = function() {
      var args = arguments;

      return function() {
        if (Array.prototype.some.call(args, function(arg) { return !!$scope.newItem[arg]; })) {
          _acceptNew();
        }
      };
    };

    this.createVerifyRemoveAddressFunction = function(/* valuesToCheck... */) {
      var args = arguments;
      return function($index) {
       $scope.content.forEach(function(item) {
          if (Array.prototype.every.call(args, function(arg) { return !item[arg]; })) {
            _acceptRemove($index);
          }
        });
      };
    };

    $scope.$watch('content', _updateTypes);

    $scope.content = [];
    $scope.newItem = {};
  })
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
        onSave: '=multiInputOnSave',
        name: '@'
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
        scope.verifyNew = controller.createVerifyNewAddressFunction('street', 'zip', 'city', 'country');
        scope.verifyRemove = controller.createVerifyRemoveAddressFunction('street', 'zip', 'city', 'country');
      }
    };
  })
  .directive('contactDisplay', function() {
    return {
      restrict: 'E',
      scope: {
        'contact': '=',
        'update': '=',
        'modify': '='
      },
      templateUrl: '/contact/views/partials/contact-display.html'
    };
  })
  .directive('contactEditionForm', function() {
    return {
      restrict: 'E',
      scope: {
        'contact': '=',
        'formattedBirthday': '=',
        'defaultAvatar': '=',
        'update': '=',
        'modify': '='
      },
      templateUrl: '/contact/views/partials/contact-edition-form.html'
    };
  })
  .directive('inlineEditableInput', function($timeout, $rootScope, ESCAPE_KEY, ENTER_KEY) {
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
        scope.updateSuccessFlag = false;
        scope.lastModifiedFlag = false;
        oldInputGroupWidth = inputGroup.width();
        _resizeInputGroup();
        $timeout(_toggleGroupButtons, 0);
      });

      input.bind('blur', function() {
        $timeout(function() {
          if (oldValue !== controller.$viewValue) {
            if (attrs.newItem !== 'true') {
              scope.lastModifiedFlag = true;
            }
            else {
              scope.$watch(attrs.newItem, function() {
                $rootScope.$broadcast('contact:flag:last:item', attrs.name);
              });
            }
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
        var escape = event.which === ESCAPE_KEY;
        var enter = event.which === ENTER_KEY;
        var target = event.target;
        if (escape) {
          $timeout(scope.resetInput, 0);
          target.blur();
          event.preventDefault();
        }
        if (enter) {
          target.blur();
          event.preventDefault();
        }
      });

      scope.saveInput = scope.onSave || function() {};

      scope.resetInput = function() {
        controller.$setViewValue(oldValue);
        controller.$render();
      };

      $rootScope.$on('contact:updated', function() {
        if (attrs.newItem !== 'true') {
          scope.updateSuccessFlag = true;
        }
        else {
          $rootScope.$broadcast('contact:add:check');
        }
      });

      $rootScope.$on('contact:flag:last:item', function(event, fieldName) {
        $timeout(function() {
          if (attrs.lastItem === 'true' && fieldName === attrs.name) {
            scope.lastModifiedFlag = true;
          }
        }, 0);
      });

      $rootScope.$on('contact:add:check', function() {
        if (attrs.lastItem === 'true') {
          scope.updateSuccessFlag = true;
        }
      });

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
  .directive('editableField', function($timeout, $rootScope, ESCAPE_KEY, ENTER_KEY) {
    function link(scope, element, attrs, controller) {
      var oldValue;

      element.bind('focus', function() {
        oldValue = controller.$viewValue;
        $rootScope.$broadcast('contact:reset:flags', attrs.name);
      });

      element.bind('blur', function() {
        $timeout(function() {
          if (oldValue !== controller.$viewValue) {
            $rootScope.$broadcast('contact:set:flag', attrs.name);
            scope.save();
          }
          if (scope.onBlur) {
            scope.onBlur();
          }
        }, 200);
      });
      element.bind('keydown', function(event) {
        var escape = event.which === ESCAPE_KEY;
        var target = event.target;
        if (escape) {
          $timeout(scope.reset, 0);
          target.blur();
          event.preventDefault();
        }
        if (attrs.name === 'date') {
          var enter = event.which === ENTER_KEY;
          if (enter) {
            target.blur();
            event.preventDefault();
          }
        }
      });
      scope.save = scope.onSave || function() {};

      scope.reset = function() {
        controller.$setViewValue(oldValue);
        controller.$render();
      };
    }

    return {
      scope: {
        ngModel: '=',
        onSave: '=',
        onBlur: '='
      },
      require: 'ngModel',
      restrict: 'A',
      link: link
    };
  })
  .directive('inlineNotify', function($rootScope) {
    function link(scope, element, attrs) {
      $rootScope.$on('contact:reset:flags', function(event, fieldName) {
        if (fieldName === attrs.name) {
          scope.updateSuccessFlag = false;
          scope.lastModifiedFlag = false;
        }
      });
      $rootScope.$on('contact:set:flag', function(event, fieldName) {
        if (fieldName === attrs.name) {
          scope.lastModifiedFlag = true;
        }
      });
      $rootScope.$on('contact:updated', function() {
        scope.updateSuccessFlag = true;
      });
    }
    return {
      scope: {
        name: '@'
      },
      restrict: 'E',
      templateUrl: '/contact/views/partials/inline-notify.html',
      link: link
    };
  })
  .directive('contactListItem', function($rootScope, $location, contactsService, notificationFactory, GRACE_DELAY, gracePeriodService, $q) {
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

        $scope.displayContact = function($event) {
          $location.path('/contact/show/' + $scope.bookId + '/' + $scope.contact.id);
        };

        $scope.deleteContact = function() {
          contactsService.remove($scope.bookId, $scope.contact, GRACE_DELAY).then(null, function(err) {
            notificationFactory.weakError('Contact Delete', 'The contact cannot be deleted, please retry later');

            return $q.reject(err);
          }).then(function(taskId) {
            return gracePeriodService.grace('You have just deleted a contact (' + $scope.contact.displayName + ').', 'Cancel')
                .then(function(data) {
                  if (data.cancelled) {
                    return gracePeriodService.cancel(taskId).then(function() {
                      data.success();
                      $rootScope.$broadcast('contact:cancel:delete', $scope.contact);
                    }, function(err) {
                      data.error('Cannot cancel contact delete, the contact is deleted');
                      return $q.reject(err);
                    });
                  }
            });
          });
        };
      }
    };
  })
  .directive('contactPhoto', function(DEFAULT_AVATAR) {
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
  })
  .directive('contactSearchForm', function() {
    return {
      restrict: 'E',
      templateUrl: '/contact/views/partials/contact-search-form.html'
    };
  })
  .directive('relaxedDate', function(DATE_FORMAT, $dateParser, $dateFormatter) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, controller) {
        element.attr('placeholder', DATE_FORMAT);

        controller.$parsers.push(function(text) {
          return $dateParser({ format: DATE_FORMAT }).parse(text) || text;
        });
        controller.$formatters.push(function(dateOrText) {
          return $dateFormatter.formatDate(dateOrText, DATE_FORMAT);
        });
      }
    };
  });
