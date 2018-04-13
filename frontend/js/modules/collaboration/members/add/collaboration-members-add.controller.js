(function() {
  'use strict';

  angular.module('esn.collaboration')
    .controller('ESNCollaborationMembersAddController', ESNCollaborationMembersAddController);

  function ESNCollaborationMembersAddController(esnPaginationtionProviderBuilder, _, esnCollaborationClientService) {
    var self = this;

    var options = {
      offset: self.options.offset,
      limit: self.options.limit,
      objectTypeFilter: self.objectType
    };

    self.onChange = onChange;
    self.$onInit = $onInit;

    function $onInit() {
      getMembersProvider();
      self.loadMoreElements();
    }

    function onChange() {
      self.elements = [];
      self.infiniteScrollCompleted = false;
      getMembersProvider();
      self.loadMoreElements();
    }

    function getMembersProvider() {
      esnPaginationtionProviderBuilder(self, 'esnCollaborationMembersAdd', getInvitablePeople, options);
    }

    function getInvitablePeople(options) {
      options = options || {};

      return esnCollaborationClientService.getInvitablePeople(self.objectType, self.collaboration._id,
        Object.assign({}, options, {search: self.query})
      ).then(function(response) {
        response.data = response.data.map(function(user) {
          if (!user.emails) {
            user.emails = [];
            user.emails.push(user.accounts[0].emails[0]);
          }

          return user;
        }) || [];

        return response;
      });
    }

  }
})();
