'use strict';

angular.module('esn.dropdownList', [])

  .directive('dropdownList', function($dropdown) {

    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var dropdown;

        function openDropdown() {
          dropdown = $dropdown(element, {
            scope: scope,
            trigger: 'manual',
            show: true,
            prefixEvent: 'dropdown-list',
            autoClose: true,
            template: '<ul class="dropdown-menu" role="menu"><li><div ng-include="\'' + attrs.dropdownList + '\'"></div></li></ul>',
            placement: 'bottom-right',
            container: angular.element(element.parent())
          });
        }

        function closeDropdown() {
          dropdown && dropdown.hide();
        }

        element.click(function() {
          if (dropdown && dropdown.$isShown) {
            closeDropdown();
          } else {
            openDropdown();
          }
        });

        scope.$on('$destroy', closeDropdown);
      }
    };
  });
