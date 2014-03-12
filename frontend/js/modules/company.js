'use strict';

angular.module('esn.company', ['restangular'])
.factory('companyAPI', ['Restangular', function(Restangular) {
  function search(searchQuery) {
    return Restangular.all('companies').getList(searchQuery);
  }

  return {
    search: search
  };
}])
.directive('ensureUniqueCompany', ['companyAPI', function(companyAPI) {
  return {
    restrict: 'A',
    scope: true,
    require: 'ngModel',
    link: function(scope, elem , attrs, control) {
      var lastTest = null;
      elem.on('blur', function() {
        var companyName = elem.val();
        if (companyName === lastTest) {
          return;
        }

        lastTest = companyName;

        if (!companyName.length) {
          return;
        }

        control.$setValidity('ajax', false);

        companyAPI.search({name: companyName}).then(
          function() {
            control.$setValidity('ajax', true);
            control.$setValidity('unique', false);
          },
          function() {
            control.$setValidity('ajax', true);
            control.$setValidity('unique', true);
          }
        );
      });
    }
  };
}]);
