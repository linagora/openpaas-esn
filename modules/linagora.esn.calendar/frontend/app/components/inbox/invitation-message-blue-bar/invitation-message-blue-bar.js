'use strict';

angular.module('esn.calendar')

  .component('calInboxInvitationMessageBlueBar', {
    controller: 'calInboxInvitationMessageBlueBarController',
    bindings: {
      message: '<'
    },
    templateUrl: '/calendar/app/components/inbox/invitation-message-blue-bar/invitation-message-blue-bar.html'
  });
