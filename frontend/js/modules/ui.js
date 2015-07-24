'use strict';

angular.module('esn.ui', [])

  .constant('DEFAULT_FAB_TYPE', 'mdi-content-create')

  // types are defined from http://fezvrasta.github.io/bootstrap-material-design/bootstrap-elements.html#icon
  .constant('FAB_TYPES', {
    create: 'mdi mdi-plus'
  })

  .directive('fab', function(FAB_TYPES, DEFAULT_FAB_TYPE) {
    return {
      scope: {
        onClick: '&',
        type: '@'
      },
      templateUrl: '/views/modules/ui/fab.html',
      link: function($scope) {

        $scope.fab_type = FAB_TYPES[$scope.type] || DEFAULT_FAB_TYPE;

        $scope.fabAction = function() {
          $scope.onClick();
        };
      }
    };
  });
