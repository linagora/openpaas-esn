(function(angular) {
  angular.module('linagora.esn.davproxy')
    .factory('davProxyPrincipalService', davProxyPrincipalService);

  function davProxyPrincipalService(davClient) {
    return {
      getGroupMembership: getGroupMembership
    };

    function getGroupMembership(principal) {
      return davClient('PROPFIND', principal, { Accept: 'application/json' })
        .then(function(response) {
          return response.data && response.data['group-membership'];
        });
    }
  }
})(angular);
