(function(angular) {
  'use strict';

  angular.module('esn.search').component('esnSearchAdvancedForm', {
    templateUrl: '/views/modules/search/form/advanced/search-advanced-form.html',
    controller: 'ESNSearchAdvancedFormController',
    controllerAs: 'ctrl',
    bindings: {
      query: '=',
      search: '&'
    }
  });
})(angular);
