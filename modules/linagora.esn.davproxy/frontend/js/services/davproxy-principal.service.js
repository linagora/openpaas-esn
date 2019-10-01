(function(angular) {
  angular.module('linagora.esn.davproxy')
    .factory('davproxyPrincipalService', davproxyPrincipalService);

  function davproxyPrincipalService(davClient) {
    return {
      getGroupMemberShip: getGroupMemberShip
    };

    function getGroupMemberShip(principal) {
      return davClient('PROPFIND', principal, { Accept: 'application/json' })
        .then(function(response) {
          return response.data && response.data['group-membership'];
        });
    }
  }
})(angular);
