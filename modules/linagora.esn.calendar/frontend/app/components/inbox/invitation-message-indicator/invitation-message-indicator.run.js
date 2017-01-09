'use strict';

angular.module('esn.calendar')

  .run(function(dynamicDirectiveService, DynamicDirective, _, INVITATION_MESSAGE_HEADERS) {
    var shouldInject = function(scope) {
          return scope.item && scope.item.headers && INVITATION_MESSAGE_HEADERS.UID in scope.item.headers;
        },
        directive = new DynamicDirective(shouldInject, 'cal-inbox-invitation-message-indicator');

    dynamicDirectiveService.addInjection('inbox-message-indicators', directive);
  });
