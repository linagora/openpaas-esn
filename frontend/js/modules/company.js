'use strict';

angular.module('esn.company', ['restangular'])
.factory('companyAPI', ['Restangular', function(Restangular) {
  function get(name) {
    return Restangular.one('domains/company', name).get();
  }

  return {
    get: get
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

        companyAPI.get(companyName).then(
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
