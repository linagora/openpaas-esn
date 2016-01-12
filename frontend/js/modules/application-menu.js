'use strict';

angular.module('esn.application-menu', ['op.dynamicDirective'])
  .constant('POPOVER_APPLICATION_MENU_OPTIONS', {
    animation: 'am-fade',
    placement: 'bottom',
    templateUrl: '/views/modules/application-menu/application-menu.html',
    html: false,
    trigger: 'manual',
    autoClose: true
  })
  .config(function(dynamicDirectiveServiceProvider) {
    var home = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-home', {priority: 50});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', home);
    var logout = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-logout', {priority: -50});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', logout);
  })
  .directive('applicationMenuToggler', function($popover, POPOVER_APPLICATION_MENU_OPTIONS) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/application-menu/application-menu-toggler.html',
      link: function(scope, element) {
        scope.popoverOptions = POPOVER_APPLICATION_MENU_OPTIONS;
        var popover = $popover(element, scope.popoverOptions);
        element.click(popover.toggle.bind(null, null));
      }
    };
  })
  .directive('forceCloseOnLinksClick', function($timeout) {
    return {
      restrict: 'A',
      link: function(scope, element) {
        $timeout(function() {
          var links = element.find('a');
          links.click(scope.$parent.$hide.bind(null, null));
        }, 50);
      }
    };
  })
  .directive('forceMarginLeft', function($timeout) {
    return {
      restrict: 'A',
      scope: {},
      link: function(scope, element, attrs) {
        $timeout(function() {
          var offset = $(element).offset();
          $(element).offset({top: offset.top, left: offset.left - attrs.forceMarginLeft});
        }, 50);
      }
    };
  })
  .directive('applicationMenuHome', function() {
    return {
      retrict: 'E',
      replace: true,
      template: '<div><a href="/#/"><i class="mdi mdi-home"/><span class="label">Home</span></a></div>'
    };
  })
  .directive('applicationMenuLogout', function() {
    return {
      retrict: 'E',
      replace: true,
      template: '<div><a href="/logout"><i class="mdi mdi-home"/><span class="label">Logout</span></a></div>'
    };
  });
