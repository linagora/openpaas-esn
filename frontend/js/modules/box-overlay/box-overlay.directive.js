(function(angular) {
  'use strict';

  angular.module('esn.box-overlay').directive('boxOverlay', boxOverlay);

  function boxOverlay(boxOverlayOpener) {
    return {
      restrict: 'A',
      scope: {
        boxId: '@',
        boxTitle: '@',
        boxTemplateUrl: '@',
        boxInitialState: '@',
        boxCloseable: '=',
        boxAllowedStates: '='
      },
      link: function(scope, element) {
        element.on('click', function() {
          boxOverlayOpener.open({
            id: scope.boxId,
            title: scope.boxTitle,
            templateUrl: scope.boxTemplateUrl,
            initialState: scope.boxInitialState,
            closeable: scope.boxCloseable,
            allowedStates: scope.boxAllowedStates
          });
        });
      }
    };
  }

})(angular);
