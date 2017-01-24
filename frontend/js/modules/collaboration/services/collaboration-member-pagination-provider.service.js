(function() {
  'use strict';

  angular.module('esn.collaboration')
    .factory('esnCollaborationMemberPaginationProvider', esnCollaborationMemberPaginationProvider);

    function esnCollaborationMemberPaginationProvider(esnCollaborationClientService) {

      function CollaborationMemberPaginationProviderService(collaboration, options) {
        this.collaboration = collaboration;
        this.options = angular.extend({limit: 20, offset: 0}, options);
      }

      CollaborationMemberPaginationProviderService.prototype.loadNextItems = function() {
        var self = this;

        return esnCollaborationClientService.getMembers(self.collaboration.objectType, self.collaboration.id, self.options).then(function(response) {
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

      return CollaborationMemberPaginationProviderService;
  }
})();
