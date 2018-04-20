(function(angular) {
  'use strict';

  angular.module('esn.search').component('searchAdvancedForm', {
    templateUrl: '/views/modules/search/form/advanced/search-advanced-form.html',
    controller: 'SearchAdvancedFormController',
    controllerAs: 'ctrl',
    bindings: {
      query: '=',
      search: '&'
    }
  });
})(angular);
