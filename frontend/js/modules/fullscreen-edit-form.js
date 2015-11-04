'use strict';

angular.module('esn.fullscreen-edit-form', ['esn.scroll'])

  .directive('fullscreenEditFormContainer', function() {
    return {
      restrict: 'A',
      controller: function() {},
      link: function($scope, element, attrs, controller) {
        controller.container = element;
      }
    };
  })

  .directive('fullscreenEdit', function($compile, $parse, $timeout, $rootScope) {
    return {
      restrict: 'A',
      require: '^fullscreenEditFormContainer',
      link: function($scope, element, attrs, fullscreenEditFormContainer) {

        function bindAttributes() {
          $scope.templateUrl = attrs.fullscreenEdit;
        }

        function updatePlaceholderAndShownTags() {
          var DANGER_ZONE_WIDTH_RATIO = 0.75,
              tagList = element.find('.tag-list'),
              tags = tagList.find('.tag-item');

          if (tags.length === 0) {
            $scope.dynamicPlaceholder = attrs.emptyPlaceholder;
          } else {
            var moreTags = tags
              .removeClass('hide')
              .filter(function() {
                return angular.element(this).position().left > tagList.width() * DANGER_ZONE_WIDTH_RATIO;
              })
              .addClass('hide')
              .length;

            $scope.dynamicPlaceholder = moreTags === 0 ? attrs.nonEmptyPlaceholder : '+' + moreTags;
          }
        }

        function appendOverlay() {
          element.find('.tag-list').append('<div class="overlay"></div>');
        }

        var fullscreenForm = $compile('<fullscreen-edit-form></fullscreen-edit-form>')($scope);

        element.find('input').focus(function() {
          fullscreenForm.addClass('focused');
          $rootScope.$broadcast('fullscreenEditForm:show');

          $timeout(function() {
            fullscreenForm.find('input').focus();
          }, 0, false);
        });

        $scope.close = function() {
          fullscreenForm.removeClass('focused');
          $rootScope.$broadcast('fullscreenEditForm:close');
          updatePlaceholderAndShownTags();
        };

        fullscreenEditFormContainer.container.append(fullscreenForm);

        bindAttributes();
        appendOverlay();
        updatePlaceholderAndShownTags();
      }
    };
  })

  .directive('autoScrollDownNgtagsinput', function(elementScrollDownService) {
    return {
      restrict: 'A',
      link: function(scope, element) {
        scope.$on('unifiedinbox:tags_added', function() {
          elementScrollDownService.autoScrollDown(element.find('div.tags'));
        });
      }
    };
  })

  .directive('fullscreenEditForm', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/fullscreen-edit-form/fullscreen-edit-form.html'
    };
  });
