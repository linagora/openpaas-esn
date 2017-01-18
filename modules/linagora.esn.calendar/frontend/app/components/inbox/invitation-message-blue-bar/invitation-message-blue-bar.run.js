'use strict';

angular.module('esn.calendar')

  .run(function(dynamicDirectiveService, DynamicDirective, _, INVITATION_MESSAGE_HEADERS) {
    var shouldInject = function(scope) {
          return scope.email && scope.email.headers && INVITATION_MESSAGE_HEADERS.UID in scope.email.headers;
        },
        directive = new DynamicDirective(shouldInject, 'cal-inbox-invitation-message-blue-bar', {
          attributes: [{ name: 'message', value: 'email' }]
        });

    dynamicDirectiveService.addInjection('inbox-message-info', directive);
  });
