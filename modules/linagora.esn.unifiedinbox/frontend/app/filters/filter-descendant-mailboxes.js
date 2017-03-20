(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .filter('inboxFilterDescendantMailboxes', function(_) {
      return function(mailboxes, id, filterOnlyParentMailbox) {
        if (!mailboxes || !id) {
          return mailboxes;
        }

        var parent = _.find(mailboxes, { id: id }),
            descendants;

        if (!parent) {
          return mailboxes;
        }

        if (!filterOnlyParentMailbox) {
          descendants = parent.descendants;
        }

        return _.filter(mailboxes, function(mailbox) {
          return mailbox.id !== id && (filterOnlyParentMailbox || !_.find(descendants, { id: mailbox.id }));
        });
      };
    });

})();
