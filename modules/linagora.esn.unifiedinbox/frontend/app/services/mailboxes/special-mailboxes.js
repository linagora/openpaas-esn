(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxSpecialMailboxes', function(jmap, _) {
      var mailboxes = [{
        id: 'all',
        name: 'All Mail',
        role: { value: 'all' },
        filter: {
          unprocessed: true,
          notInMailboxes: [
            jmap.MailboxRole.ARCHIVE,
            jmap.MailboxRole.DRAFTS,
            jmap.MailboxRole.OUTBOX,
            jmap.MailboxRole.SENT,
            jmap.MailboxRole.TRASH,
            jmap.MailboxRole.SPAM
          ]
        }
      }];

      mailboxes.forEach(function(mailbox) {
        mailbox.role = mailbox.role || {};
        mailbox.qualifiedName = mailbox.name;
        mailbox.unreadMessages = 0;
      });

      function list() {
        return mailboxes;
      }

      function get(mailboxId) {
        return _.find(mailboxes, { id: mailboxId });
      }

      return {
        list: list,
        get: get
      };
    });

})();
