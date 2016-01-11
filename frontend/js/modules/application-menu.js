'use strict';

angular.module('esn.application-menu', ['op.dynamicDirective'])
  .constant('POPOVER_APPLICATION_MENU_OPTIONS', {
    animation: 'am-fade',
    placement: 'bottom',
    templateUrl: '/views/modules/application-menu/application-menu.html',
    html: false,
    trigger: 'manual',
    autoClose: true,
    container: '#header'
  })
  .directive('applicationMenuToggler', function($popover, POPOVER_APPLICATION_MENU_OPTIONS) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/application-menu/application-menu-toggler.html',
      link: function(scope, element) {
        scope.popoverOptions = POPOVER_APPLICATION_MENU_OPTIONS;
        var popover = $popover(element, scope.popoverOptions);
        element.find('a').click(function() {
          popover.toggle();
        });
      }
    };
  });
