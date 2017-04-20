(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox.ml')

    .run(function(inboxMLConfig, inboxSpecialMailboxes, INBOX_SUGGESTIONS_MAILBOX) {
      inboxMLConfig.classification.then(function(config) {
        if (config.enabled && config.showSuggestionsFolder) {
          inboxSpecialMailboxes.add(INBOX_SUGGESTIONS_MAILBOX);
        }
      });
    });

})();
