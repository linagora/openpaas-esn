'use strict';

angular.module('esn.application-menu', [
  'op.dynamicDirective',
  'feature-flags'
])

  .constant('POPOVER_APPLICATION_MENU_OPTIONS', {
    animation: 'am-fade',
    placement: 'bottom',
    templateUrl: '/views/modules/application-menu/application-menu.html',
    html: false,
    trigger: 'manual',
    autoClose: true,
    prefixEvent: 'application-menu',
    container: 'body'
  })
  .constant('APP_MENU_OPEN_EVENT', 'application-menu.open')

  .factory('applicationMenuTemplateBuilder', function(featureFlags, _) {
    var template =
        '<div>' +
          '<a href="<%- href %>" target="<%- target %>" rel="<%- rel %>">' +
            '<img class="esn-application-menu-icon" src="<%- iconURL %>" fallback-src="/images/application.png"/>' +
            '<span class="label" translate>' +
              '<%- label %>' +
            '</span>' +
          '</a>' +
        '</div>';

    var svgTemplate =
      '<div>' +
        '<a href="<%- href %>" target="<%- target %>" rel="<%- rel %>">' +
          '<div class="esn-application-menu-icon" ng-include="\'<%- iconURL %>\'"></div>' +
          '<span class="label" translate>' +
            '<%- label %>' +
          '</span>' +
        '</a>' +
      '</div>';

    return function(href, icon, label, flag, isDisplayedByDefault) {
      var iconURL, aHref, aTarget;
      var aRel = '';
      var iconUrlTemplate = '/images/application-menu/<%- icon %>-icon.svg';
      var defaultValue = angular.isDefined(isDisplayedByDefault) ? isDisplayedByDefault : true;
      var isActive = defaultValue;

      if (angular.isDefined(flag)) {
        isActive = featureFlags.isOn(flag) === undefined ? defaultValue : featureFlags.isOn(flag);
      }

      if (!isActive) {
        return '';
      }

      if (icon.url) {
        iconURL = icon.url;
      } else if (icon.name) {
        iconURL = _.template(iconUrlTemplate)({icon: icon.name});
      }

      if (angular.isObject(href)) {
        aHref = href.url;
        aTarget = href.target || '';
        aRel = href.rel || aRel;
      } else {
        aHref = href;
        aTarget = '';
      }

      return iconURL && iconURL.match(/.\S+\.svg/) ?
        _.template(svgTemplate)({ href: aHref, target: aTarget, rel: aRel, iconURL: iconURL, label: label }) :
        _.template(template)({ href: aHref, target: aTarget, rel: aRel, iconURL: iconURL, label: label });
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

        popover.$scope.$on('application-menu.show.before', function() {
          body.append(backdrop);
          $rootScope.$broadcast(APP_MENU_OPEN_EVENT);
          scope.$applyAsync();
        });

        popover.$scope.$on('application-menu.hide.before', function() {
          backdrop.remove();
          scope.$applyAsync();
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
  });
