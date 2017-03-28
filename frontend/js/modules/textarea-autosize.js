(function() {
  'use strict';

  angular.module('esn.textarea-autosize', ['esn.form.helper'])
    .directive('esnTextareaAutosize', esnTextareaAutosize);

  function esnTextareaAutosize(autosize) {
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        textareaMaxRows: '='
      },
      link: link
    };

    function link(scope, element, attrs, ngModel) {
      var numberRows = parseInt(scope.textareaMaxRows, 10);
      var lineHeight = parseInt(element.css('line-height'), 10);

      setAutoSize();

      function setAutoSize() {
        element.css('max-height', (numberRows * lineHeight));
        autosize(element);
      }

      scope.$watch(function() {
        return ngModel.$modelValue;
      }, function(textAreaNewValue) {
        if (textAreaNewValue.length === 0) {
          autosize.update(element);
        }
      });
    }
  }
})();
