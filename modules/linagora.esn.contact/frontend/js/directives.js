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
          //console.log('new_field');
          _acceptNew();
        }
      };
    };

    this.createVerifyRemoveFunction = function(valueToCheck) {
      return function($index) {
        var item = $scope.content[$index];
        if (!item[valueToCheck]) {
          //console.log('remove_field');
          _acceptRemove($index);
        }
      };
    };

    this.createVerifyNewAddressFunction = function() {
      var args = arguments;

      return function() {
        if (Array.prototype.some.call(args, function(arg) { return !!$scope.newItem[arg]; })) {
          //console.log('new_address_field');
          _acceptNew();
        }
      };
    };

    this.createVerifyRemoveAddressFunction = function(/* valuesToCheck... */) {
      var args = arguments;
      //console.log($scope);
      return function($index) {
       $scope.content.forEach(function(item){
          //console.log(args);
          //console.log(item);
          if (Array.prototype.every.call(args, function(arg) { return !item[arg]; })) {
            //console.log('remove_adress_field');
            _acceptRemove($index);
          }
        });
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
            console.log('save_input');
            scope.saveInput();
          }
          _resetInputGroup();
          _toggleGroupButtons();
          //console.log(scope);
          if (scope.onBlur) {
            scope.onBlur();
          }
        }, 200);
      });

      input.bind('keydown', function(event) {
        var escape = event.which === 27;
        var enter = event.which === 13;
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
  .directive('editableTextarea', function($timeout) {
    function link(scope, element, attrs, controller) {
      var textarea = element.find('textarea');
      var oldValue;

      textarea.bind('focus', function() {
        oldValue = controller.$viewValue;
      });

      textarea.bind('blur', function() {
        $timeout(function() {
          if (oldValue !== controller.$viewValue) {
            scope.saveTextarea();
          }
          if (scope.onBlur) {
            scope.onBlur();
          }
        }, 200);
      });

      textarea.bind('keydown', function(event) {
        var escape = event.which === 27;
        var target = event.target;
        if (escape) {
          $timeout(scope.resetTextarea, 0);
          target.blur();
          event.preventDefault();
        }
      });

      scope.saveTextarea = scope.onSave || function() {};

      scope.resetTextarea = function() {
        controller.$setViewValue(oldValue);
        controller.$render();
      };
    }

    return {
      scope: {
        ngModel: '=',
        rows: '=',
        placeholder: '@',
        onSave: '=',
        textareaClass: '@',
        onBlur: '='
      },
      require: 'ngModel',
      restrict: 'E',
      templateUrl: '/contact/views/partials/editable-textarea.html',
      link: link
    };
  })
  .directive('editableTagsInput', function($timeout) {
    function link(scope, element, attrs, controller) {
      var tagsInput = element.find('tags-input');
      var oldValue;

      tagsInput.bind('focus', function() {
        oldValue = controller.$viewValue;
      });

      tagsInput.bind('blur', function() {
        $timeout(function() {
          scope.saveTagsInput();
          if (oldValue !== controller.$viewValue) {
            scope.saveTagsInput();
          }
          if (scope.onBlur) {
            scope.onBlur();
          }
        }, 200);
      });

      tagsInput.bind('keydown', function(event) {
        var escape = event.which === 27;
        var target = event.target;
        if (escape) {
          $timeout(scope.resetTagsInput, 0);
          target.blur();
          event.preventDefault();
        }
      });

      scope.saveTagsInput = scope.onSave || function() {};

      scope.resetTagsInput = function() {
        controller.$setViewValue(oldValue);
        controller.$render();
      };
    }

    return {
      scope: {
        ngModel: '=',
        minLength: '=',
        placeholder: '@',
        onSave: '=',
        onBlur: '='
      },
      require: 'ngModel',
      restrict: 'E',
      templateUrl: '/contact/views/partials/editable-tags-input.html',
      link: link
    };
  })
  .directive('datepickerInlineEditableInput', function($timeout) {
    function link(scope, element, attrs, controller) {
      var input = element.find('input');
      var oldValue;

      input.bind('focus', function() {
        oldValue = controller.$viewValue;
      });

      input.bind('blur', function() {
        $timeout(function() {
          if (oldValue !== controller.$viewValue) {
            scope.saveDatepickerInput();
          }
          if (scope.onBlur) {
            scope.onBlur();
          }
        }, 200);
      });

      input.bind('keydown', function(event) {
        var escape = event.which === 27;
        var target = event.target;
        if (escape) {
          $timeout(scope.resetDatepickerInput, 0);
          target.blur();
          event.preventDefault();
        }
      });

      scope.saveDatepickerInput = scope.onSave || function() {};

      scope.resetDatepickerInput = function() {
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
        onBlur: '=',
        name: '@',
        datepicker: '@',
        datepickerDataStart: '=',
        datepickerDataDateFormat: '@',
        datepickerDataAutoclose: '='
      },
      require: 'ngModel',
      restrict: 'E',
      templateUrl: '/contact/views/partials/datepicker-inline-editable-input.html',
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
  }])
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
