(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxSpecialMailboxes', function(_) {
      var mailboxes = [];

      return {
        list: list,
        get: get,
        add: add
      };

      /////

      function list() {
        return mailboxes;
      }

      function get(mailboxId) {
        return _.find(mailboxes, { id: mailboxId });
      }

      function add(mailbox) {
        mailbox.role = mailbox.role || {};
        mailbox.qualifiedName = mailbox.name;
        mailbox.unreadMessages = 0;

        mailboxes.push(mailbox);
      }
    });

})();
