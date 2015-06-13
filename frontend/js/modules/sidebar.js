'use strict';

angular.module('esn.sidebar', [])
.directive('sidebar', ['$rootScope', '$document', function($rootScope, $document) {
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

       scope.$eval(scope.clickOutside);

    }

    function open() {
      $document.on('click', clickOutsideHandler);
      element.addClass('toggled');
    }

    function close() {
      $document.on('click', clickOutsideHandler);
      element.removeClass('toggled');
    }

    scope.onClickOutside = close;

    $rootScope.$on('sidebar:display', function(evt, data) {
      if (data.display === true && opened === false) {
        opened = true;
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
    restrict: 'A',
    link: link
  };
}]);
