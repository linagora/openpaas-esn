(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactMaintenanceDomainMembersService', contactMaintenanceDomainMembersService);

  function contactMaintenanceDomainMembersService(contactRestangularService) {
    return {
      synchronize: synchronize,
      synchronizeForDomain: synchronizeForDomain
    };

    function synchronize() {
      return contactRestangularService
        .all('addressbooks')
        .one('domainmembers')
        .one('synchronize')
        .post();
    }

    function synchronizeForDomain(domainId) {
      return contactRestangularService
        .all('addressbooks')
        .one('domainmembers')
        .one('synchronize')
        .customPOST('', '', { domain_id: domainId });
    }
  }
})(angular);
