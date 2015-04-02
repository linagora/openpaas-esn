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
      var lastValue = null;
      control.$viewChangeListeners.push(function() {
        var companyName = control.$viewValue;
        if (companyName === lastValue) {
          return;
        }

        lastValue = companyName;

        if (!companyName.length) {
          return;
        }

        control.$setValidity('ajax', false);
        (function(searchField) {
          companyAPI.search({name: searchField}).then(
            function() {
              if (lastValue !== searchField) {
                return;
              }
              control.$setValidity('ajax', true);
              control.$setValidity('unique', false);
            },
            function() {
              if (lastValue !== searchField) {
                return;
              }
              control.$setValidity('ajax', true);
              control.$setValidity('unique', true);
            }
          );
        })(lastValue);
      });
    }
  };
}])
.factory('companyUserService', function() {
  function isInternalUser(userEmail, company) {
    if (!userEmail || !company) {
      return false;
    }
    var emailDomain = userEmail.replace(/.*@/, '');
    var emailDomainWithoutSuffix = emailDomain.split('.')[0];
    return emailDomain === company || emailDomainWithoutSuffix === company;
  }

  return {
    isInternalUser: isInternalUser
  };
});
