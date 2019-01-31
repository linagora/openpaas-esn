(function(angular) {
  'use strict';

  angular.module('esn.collaboration')
    .factory('esnCollaborationMembershipRequestsPaginationProvider', esnCollaborationMembershipRequestsPaginationProvider);

    function esnCollaborationMembershipRequestsPaginationProvider(esnCollaborationClientService) {

      function CollaborationMembershipRequestsPaginationProviderService(collaboration, options) {
        this.collaboration = collaboration;
        this.options = angular.extend({limit: 20, offset: 0}, options);
      }

      CollaborationMembershipRequestsPaginationProviderService.prototype.loadNextItems = function() {
        var self = this;

        return esnCollaborationClientService.getRequestMemberships(self.collaboration.objectType, self.collaboration.id, self.options).then(function(response) {
          var result = {
            data: response.data,
            lastPage: (response.data.length < self.options.limit)
          };

          if (!result.lastPage) {
            self.options.offset += self.options.limit;
          }

          return result;
        });
      };

      return CollaborationMembershipRequestsPaginationProviderService;
  }
})(angular);
