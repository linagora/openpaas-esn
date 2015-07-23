'use strict';

angular.module('esn.sidebar', [])
.directive('sidebar', ['$rootScope', '$document', '$timeout', function($rootScope, $document, $timeout) {
  function link(scope, element, attr) {

    var opened = false;

    function clickOutsideHandler(e) {
      var elt, sidebar = element.get(0);

      if (!e.target) {
        return;
      }

      for (elt = e.target; elt; elt = elt.parentNode) {
        if (elt === sidebar) {
          if (!e.isDefaultPrevented()) {
            close();
          }
          return;
        }
      }

      scope.onClickOutside();
    }

    function open() {
      element.addClass('toggled');
      $timeout(function() {
        $document.on('click', clickOutsideHandler);
      },0);
      opened = true;
    }

    function close() {
      $document.off('click', clickOutsideHandler);
      element.removeClass('toggled');
      $rootScope.$broadcast('sidebar:closed');
      opened = false;
    }

    scope.onClickOutside = close;

    $rootScope.$on('sidebar:display', function(evt, data) {
      if (data.display === true && opened === false) {
        open();
      } else if (data.display === false && opened === true) {
        close();
      }
    });

    return {
      open: open,
      close: close
    };
  }

  return {
    restrict: 'E',
    link: link,
    templateUrl: '/views/esn/partials/sidebar.html'
  };
}])
.directive('sideBarToggler', ['$rootScope', function($rootScope) {
  function link(scope, element) {
    element.on('click', function() {
      var askForDisplay = !element.hasClass('open');
      element.toggleClass('open');
      var data = {display: askForDisplay};
      $rootScope.$broadcast('sidebar:display', data);
    });

    scope.$on('sidebar:closed', function() {
      if (element.hasClass('open')) {
        element.removeClass('open');
      }
    });
  }
  return {
    restrict: 'A',
    scope: {},
    link: link
  };
}])
.directive('closeSidebarOnClick', ['$rootScope', function($rootScope) {
  function link(scope, element, attr) {
    element.click(function() {
      $rootScope.$broadcast('sidebar:display', {display: false});
    });
  }

  return {
    restrict: 'A',
    link: link
  };
}])
.directive('toggleSubmenu', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.click(function() {
                element.parent().toggleClass('toggled');
                element.parent().find('ul').stop(true, false).slideToggle(200);
            });
        }
    };
});
