'use strict';

angular.module('esn.ui', ['op.dynamicDirective'])

  .constant('DEFAULT_FAB_ICON', 'mdi mdi-plus')

  // types are defined from http://fezvrasta.github.io/bootstrap-material-design/bootstrap-elements.html#icon
  .constant('FAB_ICONS', {
    create: 'mdi mdi-plus'
  })

  .directive('fab', function(FAB_ICONS, DEFAULT_FAB_ICON) {
    return {
      restrict: 'AE',
      templateUrl: '/views/modules/ui/fab.html',
      link: function($scope, element, attrs) {
        $scope.options = {
          fab_icon: FAB_ICONS[attrs.icon] || DEFAULT_FAB_ICON,
          type: attrs.type || 'button'
        };
      }
    };
  })

  .directive('dynamicFabDropup', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/ui/dynamic-fab-dropup.html',
      scope: {
        anchor: '@'
      },
      link: function($scope, element) {

        function getModal() {
          return element.find('.fab-modal-dropup');
        }

        $scope.hide = function() {
          var modalElement = getModal();
          if (!modalElement) {
            return;
          }

          modalElement.removeClass('active');
        };

        $scope.onClick = function() {
          var modalElement = getModal();
          if (!modalElement) {
            return;
          }
          modalElement.toggleClass('active');
        };
      }
    };
  });
