'use strict';

angular.module('esn.fullscreen-edit-form', ['esn.scroll', 'esn.router'])

  .directive('fullscreenEdit', function($timeout) {
    return {
      restrict: 'A',
      link: function($scope, element, attrs) {

        function updatePlaceholderAndShownTags() {
          var DANGER_ZONE_WIDTH_RATIO = 0.95,
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

        element.find('.tag-list').append('<div class="overlay"></div>');

        $timeout(updatePlaceholderAndShownTags, 0);
      }
    };
  })

  .directive('autoScrollDownNgtagsinput', function($timeout, elementScrollService) {
    return {
      restrict: 'A',
      link: function(scope, element) {
        $timeout(function() {
          elementScrollService.autoScrollDown(element.find('div.tags'));
        }, 0, false);
      }
    };
  })

  .directive('autoFocusNgtagsinput', function($timeout) {
    return {
      restrict: 'A',
      link: function(scope, element) {
        $timeout(function() {
          element.find('div.tags input').focus();
        }, 0, false);
      }
    };
  });
