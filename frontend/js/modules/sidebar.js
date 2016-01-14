'use strict';

angular.module('esn.sidebar', ['esn.activitystreams-tracker'])

  .constant('CONTEXTUAL_SIDEBAR', {
    animation: 'am-fade-and-slide-left',
    prefixClass: 'aside',
    prefixEvent: 'contextual-sidebar',
    placement: 'left',
    template: '/views/modules/sidebar/contextual-sidebar.html',
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

  .directive('contextualSidebar', function(contextualSidebarService) {
    function link(scope, element, attr) {
      var options = {scope: scope},
        placementToAnimationMap = {
          left: 'am-fade-and-slide-left'
        };

      angular.forEach(['template', 'templateUrl', 'controller', 'contentTemplate'], function(key) {
        if (angular.isDefined(attr[key])) {
          options[key] = attr[key];
        }
      });

      if (angular.isDefined(placementToAnimationMap[attr.placement])) {
        options.placement = attr.placement;
        options.animation = placementToAnimationMap[attr.placement];
      }

      var sidebar = contextualSidebarService(options);

      element.on('click', function() {
        sidebar.toggle();
      });

      scope.$on('$destroy', function() {
        if (sidebar) { sidebar.destroy(); }
        options = null;
        sidebar = null;
      });
    }

    return {
      restrict: 'A',
      scope: true,
      link: link
    };
  })

  .directive('refreshNicescroll', function($timeout) {
    return {
      restric: 'A',
      link: function(scope, element, attr) {
        element.on('mouseover click touchstart touchmove', function() {
          $timeout(function() {
            element.getNiceScroll().resize();
          }, 200);
        });
      }
    };
  });

