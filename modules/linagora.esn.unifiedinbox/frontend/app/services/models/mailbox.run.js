(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .run(function(limitToFilter, jmap, inboxMailboxesCache, _, INBOX_DISPLAY_NAME_SIZE) {
      function getMailboxDescendants(mailboxId) {
        var descendants = [],
            toScanMailboxIds = [mailboxId],
            scannedMailboxIds = [];

        function pushDescendant(mailbox) {
          descendants.push(mailbox);

          if (scannedMailboxIds.indexOf(mailbox.id) === -1) {
            toScanMailboxIds.push(mailbox.id);
          }
        }

        while (toScanMailboxIds.length) {
          var toScanMailboxId = toScanMailboxIds.shift();
          var mailboxChildren = _.filter(inboxMailboxesCache, { parentId: toScanMailboxId });

          scannedMailboxIds.push(toScanMailboxId);
          mailboxChildren.forEach(pushDescendant);
        }

        return _.uniq(descendants);
      }

      Object.defineProperties(jmap.Mailbox.prototype, {
        descendants: {
          configurable: true,
          get: function() {
            return getMailboxDescendants(this.id);
          }
        },
        displayName: {
          configurable: true,
          get: function() {
            var displayName = limitToFilter(this.name, INBOX_DISPLAY_NAME_SIZE);

            if (this.name && this.name.length > INBOX_DISPLAY_NAME_SIZE) {
              displayName = displayName + '\u2026'; // http://www.fileformat.info/info/unicode/char/2026/index.htm
            }

            return displayName;
          }
        }
      });

    });

})();
