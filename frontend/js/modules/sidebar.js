'use strict';

angular.module('esn.sidebar', [
  'esn.activitystreams-tracker',
  'esn.application-menu',
  'esn.profile-menu'
  ])

  .constant('CONTEXTUAL_SIDEBAR', {
    animation: 'am-fade-and-slide-left',
    prefixClass: 'aside',
    prefixEvent: 'contextual-sidebar',
    placement: 'left',
    templateUrl: '/views/modules/sidebar/contextual-sidebar.html',
    container: false,
    element: null,
    backdrop: true,
    keyboard: true,
    html: false,
    show: false
  })

  .factory('contextualSidebarService', function($aside, CONTEXTUAL_SIDEBAR) {
    var contextualSidebarService = function(config) {
      var options = angular.extend({}, CONTEXTUAL_SIDEBAR, config);

      return $aside(options);
    };

    return contextualSidebarService;
  })

  .directive('contextualSidebar', function($timeout, contextualSidebarService) {
    function link(scope, element, attr) {
      var options = {scope: scope},
        placementToAnimationMap = {
          left: 'am-fade-and-slide-left',
          right: 'am-fade-and-slide-right'
        };

      angular.forEach(['template', 'templateUrl', 'controller', 'contentTemplate', 'controllerAs'], function(key) {
        if (angular.isDefined(attr[key])) {
          options[key] = attr[key];
        }
      });

      if (angular.isDefined(placementToAnimationMap[attr.placement])) {
        options.placement = attr.placement;
        options.animation = placementToAnimationMap[attr.placement];
      }

      if (options.placement === 'right') {
        scope.hideHeader = true;
      }

      var sidebar = contextualSidebarService(options);

      element.on('click', function() {
        sidebar.toggle();
      });

      scope.$on('$destroy', function() {
        if (sidebar) { sidebar.hide(); }
        options = null;
        sidebar = null;
      });
    }

    return {
      restrict: 'A',
      scope: true,
      link: link
    };
  });
