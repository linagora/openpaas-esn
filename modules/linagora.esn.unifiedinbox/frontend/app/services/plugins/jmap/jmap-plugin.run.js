(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .run(function($q, inboxMailboxesService, inboxPlugins, _, PROVIDER_TYPES) {
      inboxPlugins.add({
        type: PROVIDER_TYPES.JMAP,
        contextSupportsAttachments: _.constant($q.when(true)),
        resolveContextName: function(account, context) {
          return inboxMailboxesService.assignMailbox(context, {}, true).then(_.property('name'));
        },
        getEmptyContextTemplateUrl: function(account, context) {
          return inboxMailboxesService.assignMailbox(context, {}, true).then(function(mailbox) {
            if (!mailbox || mailbox.role.value) {
              return '/unifiedinbox/app/services/plugins/jmap/jmap-empty-message.html';
            }

            return '/unifiedinbox/app/services/plugins/jmap/jmap-empty-message-custom-folder.html';
          });
        }
      });
    });

})();
