'use strict';

angular.module('esn.application-menu', [
  'op.dynamicDirective'
])

  .constant('POPOVER_APPLICATION_MENU_OPTIONS', {
    animation: 'am-fade-and-slide-right',
    placement: 'bottom',
    templateUrl: '/views/modules/application-menu/application-menu.html',
    html: false,
    trigger: 'manual',
    autoClose: true,
    prefixEvent: 'application-menu'
  })
  .constant('APP_MENU_OPEN_EVENT', 'application-menu.open')

  .config(function(dynamicDirectiveServiceProvider) {
    var DD = dynamicDirectiveServiceProvider.DynamicDirective;

    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', new DD(true, 'application-menu-home', { priority: 50 }));
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', new DD(true, 'application-menu-logout', { priority: -50 }));
  })

  .factory('applicationMenuTemplateBuilder', function(_) {
    var template =
        '<div <%- featureFlag %>>' +
          '<a href="<%- href %>">' +
            '<i class="mdi <%- icon %>"/>' +
            '<span class="label">' +
              '<%- label %>' +
            '</span>' +
          '</a>' +
        '</div>';

    return function(href, icon, label, featureFlag) {
      return _.template(template)({
        href: href,
        icon: icon,
        label: label,
        featureFlag: featureFlag ? 'feature-flag="' + featureFlag + '"' : ''
      });
    };
  })

  .directive('applicationMenuToggler', function($rootScope, $document, $popover,
                                                POPOVER_APPLICATION_MENU_OPTIONS, APP_MENU_OPEN_EVENT) {
    return {
      restrict: 'E',
      scope: true,
      replace: true,
      templateUrl: '/views/modules/application-menu/application-menu-toggler.html',
      link: function(scope, element) {
        var backdrop = angular.element('<div id="application-menu-backdrop" class="modal-backdrop in visible-xs">'),
            body = $document.find('body').eq(0),
            popover = $popover(element, POPOVER_APPLICATION_MENU_OPTIONS);

        scope.isShown = false;

        popover.$scope.$on('application-menu.show.before', function() {
          body.append(backdrop);
          scope.isShown = true;
          $rootScope.$broadcast(APP_MENU_OPEN_EVENT);
          scope.$digest();
        });

        popover.$scope.$on('application-menu.hide.before', function() {
          backdrop.remove();
          scope.isShown = false;
          scope.$digest();
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
          element.find('a').click(scope.$parent.$hide.bind(null, null));
        }, 0, false);
      }
    };
  })

  .directive('forceMarginLeft', function($timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        $timeout(function() {
          var offset = element.offset();

          element.offset({top: offset.top, left: offset.left - attrs.forceMarginLeft});
        }, 0, false);
      }
    };
  })

  .directive('applicationMenuHome', function(applicationMenuTemplateBuilder) {
    return {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/', 'mdi-home', 'Home')
    };
  })

  .directive('applicationMenuLogout', function(applicationMenuTemplateBuilder) {
    return {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/logout', 'mdi-power', 'Logout')
    };
  });
