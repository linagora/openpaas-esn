(function() {
  'use strict';

  angular.module('esn.form.helper')

    .component('esnFilterInput', {
      templateUrl: '/views/modules/form-helper/filter-input/filter-input.html',
      bindings: {
        onChange: '&',
        onBlur: '&',
        autoFocusInput: '@',
        filter: '<',
        placeholder: '@',
        variant: '@?'
      },
      controller: 'esnFilterInputController'
    });

})();
