(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .run(function($q, inboxMailboxesService, inboxPlugins, PROVIDER_TYPES) {
      inboxPlugins.add({
        type: PROVIDER_TYPES.JMAP,
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
