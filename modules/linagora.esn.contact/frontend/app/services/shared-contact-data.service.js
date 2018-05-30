(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('sharedContactDataService', sharedContactDataService);

  function sharedContactDataService() {
    return {
      contact: {},
      searchQuery: null,
      categoryLetter: ''
    };
  }
})(angular);
