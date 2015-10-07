'use strict';

angular.module('esn.sidebar', [])

  .constant('CONTEXTUAL_SIDEBAR', {
    animation: 'am-fade-and-slide-right',
    prefixClass: 'aside',
    prefixEvent: 'contextual-sidebar',
    placement: 'right',
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
      var options = {scope: scope};
      angular.forEach(['template', 'templateUrl', 'controller', 'contentTemplate'], function(key) {
        if (angular.isDefined(attr[key])) { options[key] = attr[key]; }
      });
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

  .constant('SIDEBAR_EVENTS', {
    display: 'sidebar:display',
    open: 'sidebar:open',
    opened: 'sidebar:opened',
    close: 'sidebar:close',
    closed: 'sidebar:closed'
  })

  .directive('sidebar', function($rootScope, $document, $timeout, SIDEBAR_EVENTS, sideBarService) {
    function link(scope, element, attr) {

      function clickOutsideHandler(e) {
        var elt, sidebar = element.get(0);

        if (!e.target) {
          return;
        }

        for (elt = e.target; elt; elt = elt.parentNode) {
          if (elt === sidebar) {
            return;
          }
        }

        scope.onClickOutside();
      }

      function open() {
        if (sideBarService.isLeftSideBarOpen()) {
          return;
        }
        $rootScope.$broadcast(SIDEBAR_EVENTS.open);
        element.addClass('toggled');
        $timeout(function() {
          $document.on('click', clickOutsideHandler);
        }, 0);
        $rootScope.$broadcast(SIDEBAR_EVENTS.opened);
      }

      function close() {
        if (!sideBarService.isLeftSideBarOpen()) {
          return;
        }
        $rootScope.$broadcast(SIDEBAR_EVENTS.close);
        $document.off('click', clickOutsideHandler);
        element.removeClass('toggled');
        $rootScope.$broadcast(SIDEBAR_EVENTS.closed);
      }

      scope.onClickOutside = sideBarService.closeLeftSideBar;

      var unregister = $rootScope.$on(SIDEBAR_EVENTS.display, function(evt, data) {
        return data.display ? open() : close();
      });

      scope.$on('$destroy', unregister);
    }

    return {
      restrict: 'E',
      link: link,
      replace: true,
      templateUrl: '/views/modules/sidebar/sidebar.html'
    };
  })

  .directive('sideBarToggler', function(sideBarService) {
    function link(scope, element) {
      element.on('click', function() {
        sideBarService.toggleLeftSideBar();
      });
    }
    return {
      restrict: 'A',
      scope: {},
      link: link
    };
  })

  .directive('closeSidebarOnClick', function(sideBarService) {
    function link(scope, element, attr) {
      element.click(function() {
        sideBarService.closeLeftSideBar();
      });
    }

    return {
      restrict: 'A',
      link: link
    };
  })

  .directive('toggleSubmenu', function() {
    return {
      restrict: 'A',
      scope: {
        toggleSubmenuNotify: '&'
      },
      link: function(scope, element, attrs) {
        element.click(function() {
          element.parent().toggleClass('toggled');
          element.parent().find('ul').stop(true, false).slideToggle(200);
          scope.toggleSubmenuNotify.apply();
        });
      }
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
  })

  .factory('sideBarService', function($rootScope, SIDEBAR_EVENTS) {
    var isLeftSideBarOpenBool = false;

    function isLeftSideBarOpen() {
      return isLeftSideBarOpenBool;
    }

    function openLeftSideBar() {
      if (isLeftSideBarOpen()) {
        return;
      }
      var unregisterFunction = $rootScope.$on(SIDEBAR_EVENTS.opened, function() {
        isLeftSideBarOpenBool = true;
        unregisterFunction();
      });

      $rootScope.$broadcast(SIDEBAR_EVENTS.display, {display: true});
    }

    function closeLeftSideBar() {
      if (!isLeftSideBarOpen()) {
        return;
      }
      var unregisterFunction = $rootScope.$on(SIDEBAR_EVENTS.closed, function() {
        isLeftSideBarOpenBool = false;
        unregisterFunction();
      });

      $rootScope.$broadcast(SIDEBAR_EVENTS.display, {display: false});
    }

    function toggleLeftSideBar() {
      return isLeftSideBarOpen() ? closeLeftSideBar() : openLeftSideBar();
    }

    return {
      isLeftSideBarOpen: isLeftSideBarOpen,
      openLeftSideBar: openLeftSideBar,
      closeLeftSideBar: closeLeftSideBar,
      toggleLeftSideBar: toggleLeftSideBar
    };
  });
