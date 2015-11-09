'use strict';

angular.module('linagora.esn.account')
  .factory('twitterImporter', function(ACCOUNT_TYPE, contactImporterService) {
    return {
      import: function() {
        return contactImporterService.importContact(ACCOUNT_TYPE.twitter);
      }
    };
  });
