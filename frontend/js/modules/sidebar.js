'use strict';

angular.module('esn.sidebar', [])
.directive('sidebar', ['$rootScope', '$document', '$timeout', function($rootScope, $document, $timeout) {
  function link(scope, element, attr) {

    var opened = false;

    function clickOutsideHandler(e) {
      var elt;

      if (!e.target) {
        return;
      }

      for (elt = e.target; elt; elt = elt.parentNode) {
        if (elt === element.get(0)) {
          return ;
        }
      }

      scope.onClickOutside();
    }

    function open() {
      element.addClass('toggled');
      $timeout(function() {
        $document.on('click', clickOutsideHandler);
      },0);
    }

    function close() {
      $document.off('click', clickOutsideHandler);
      element.removeClass('toggled');
      $rootScope.$broadcast('sidebar:closed');
    }

    scope.onClickOutside = close;

    $rootScope.$on('sidebar:display', function(evt, data) {
      if (data.display === true && opened === false) {
        opened = true;
        open();
      } else if (data.display === false && opened === true) {
        opened = false;
        close();
      }
    });

    return {
      open: open,
      close: close
    };
  }

  return {
    restrict: 'A',
    link: link
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
      if ( element.hasClass('open')) {
        element.removeClass('open');
      }
    });
  }
  return {
    restrict: 'A',
    scope: {},
    link: link
  };
}]);
