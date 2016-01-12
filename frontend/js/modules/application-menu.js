'use strict';

angular.module('esn.application-menu', ['op.dynamicDirective'])
  .constant('POPOVER_APPLICATION_MENU_OPTIONS', {
    animation: 'am-fade',
    placement: 'bottom',
    templateUrl: '/views/modules/application-menu/application-menu.html',
    html: false,
    trigger: 'manual',
    autoClose: true,
    prefixEvent: 'application-menu'
  })
  .config(function(dynamicDirectiveServiceProvider) {
    var home = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-home', {priority: 50});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', home);
    var logout = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-logout', {priority: -50});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', logout);
  })
  .directive('applicationMenuToggler', function($document, $popover, POPOVER_APPLICATION_MENU_OPTIONS) {
    return {
      restrict: 'E',
      scope: {},
      replace: true,
      templateUrl: '/views/modules/application-menu/application-menu-toggler.html',
      link: function(scope, element) {
        var backdrop = angular.element('<div id="popover-backdrop" class="modal-backdrop in visible-xs">');
        var body = $document.find('body').eq(0);
        var popover = $popover(element, POPOVER_APPLICATION_MENU_OPTIONS);

        popover.$scope.$on('application-menu.show.before', function() {
          body.append(backdrop);
        });

        popover.$scope.$on('application-menu.hide.before', function() {
          backdrop.remove();
        });

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
