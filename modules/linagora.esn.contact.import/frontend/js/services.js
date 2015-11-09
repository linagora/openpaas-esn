'use strict';

angular.module('linagora.esn.contact.import')

  .factory('contactImportAPI', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/import/api');
      RestangularConfigurer.setFullResponse(true);
    });
  });
