(function() {
  'use strict';

  /**
   * This directive enhances the auto-size directive of material admin.
   * In fact, it corrects the initial height (i.e., when loading) of an autoSize element
   * have a see: https://github.com/jackmoore/autosize/issues/248
   */
  angular.module('esn.calendar')
         .directive('calAutoSizeAndUpdate', calAutoSizeAndUpdate);

  calAutoSizeAndUpdate.$inject = [
    '$timeout',
    'autosize'
  ];

  function calAutoSizeAndUpdate($timeout, autosize) {
    var directive = {
      restrict: 'A',
      scope: true,
      link: link
    };

    return directive;

    ////////////

    function link(scope, element) { // eslint-disable-line
      if (element[0]) {
        autosize(element);
        $timeout(function() {
          autosize.update(element);
        }, 0);
      }
    }
  }

})();
