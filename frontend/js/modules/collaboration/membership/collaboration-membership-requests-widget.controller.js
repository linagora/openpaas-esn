(function() {
  'use strict';

  angular.module('esn.collaboration')
    .controller('ESNCollaborationMembershipRequestsWidgetController', ESNCollaborationMembershipRequestsWidgetController);

  function ESNCollaborationMembershipRequestsWidgetController(
    $rootScope,
    esnCollaborationClientService,
    esnCollaborationMembershipRequestsPaginationProvider,
    infiniteScrollHelper,
    PageAggregatorService,
    ESN_COLLABORATION_MEMBER_EVENTS,
    ELEMENTS_PER_PAGE,
    _
    ) {
    var self = this;
    var aggregator;
    var results_per_page = self.elementsPerPage || ELEMENTS_PER_PAGE;
    var options = {
      offset: 0,
      limit: results_per_page,
      workflow: 'request'
    };

    self.error = false;
    self.$onInit = $onInit;
    self.$onDestroy = $onDestroy;

    function $onInit() {
      self.collaborationInviteUser = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.USERS, updateRequests);
      self.collaborationInviteUserCancel = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.CANCEL, updateRequests);
      self.collaborationRequestAccepted = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.ACCEPTED, removeRequestEntry);
      self.collaborationRequestDeclined = $rootScope.$on(ESN_COLLABORATION_MEMBER_EVENTS.DECLINED, removeRequestEntry);
    }

    function $onDestroy() {
      self.collaborationInviteUser();
      self.collaborationInviteUserCancel();
      self.collaborationRequestAccepted();
      self.collaborationRequestDeclined();
    }

    self.loadMoreElements = infiniteScrollHelper(self, function() {
      if (aggregator) {
        return load();
      }

      var provider = new esnCollaborationMembershipRequestsPaginationProvider({
        id: self.collaboration.id || self.collaboration._id,
        objectType: self.collaboration.objectType
      }, options);

      aggregator = new PageAggregatorService('CollaborationPendingInvitationsAggregator', [provider], {
        compare: function(a, b) { return b.metadata.timestamps.creation - a.metadata.timestamps.creation; },
        results_per_page: results_per_page
      });

      return load();
    });

    function load() {
      return aggregator.loadNextItems().then(_.property('data'), _.constant([]));
    }

    function removeRequestEntry(event, data) {
      if (!data.collaboration || data.collaboration.id !== self.collaboration._id) {
        return;
      }
      self.elements = self.elements.filter(function(request) {
        return request.user._id !== data.user;
      });
    }

    function updateRequests() {
      esnCollaborationClientService.getRequestMemberships(self.objectType, self.collaboration._id).then(function(response) {
        self.elements = response.data || [];
      }, function(err) {
        self.error = err.status;
      });
    }

  }
})();
