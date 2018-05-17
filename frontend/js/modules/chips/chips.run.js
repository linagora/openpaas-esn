(function(angular) {
  'use strict';

  angular.module('esn.chips').run(runBlock);

  function runBlock($templateCache) {
    $templateCache.put('ngTagsInput/tag-item.html',
      '<div class="esn-chip">' +
        '<span ng-bind="$getDisplayText()"></span>' +
        '<i class="mdi mdi-close-circle" ng-click="$removeTag()"></i>' +
      '</div>'
    );
  }
})(angular);
