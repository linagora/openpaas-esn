(function(angular) {
  'use strict';

  angular.module('esn.chips').run(runBlock);

  function runBlock($templateCache) {
    $templateCache.put('ngTagsInput/tag-item.html',
      [
        '<div',
        '    class="esn-chip"',
        '    profile-popover-card="{{ data }}"',
        '    profile-popover-card-show-mobile',
        '>',
        '  <span ng-bind="$getDisplayText()"></span>',
        '  <i class="mdi mdi-close-circle" ng-click="$removeTag()"></i>',
        '</div>'
      ].join('\n')
    );
  }
})(angular);
