'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('Emailer', function(searchService, esnAvatarService) {
    function Emailer(emailer) {
      var resolver;

      emailer.resolve = function() {
        if (!resolver) {
          resolver = searchService.searchByEmail(emailer.email).then(function(result) {
            emailer.name = result && result.displayName || emailer.name;
            emailer.avatarUrl = result && result.photo || esnAvatarService.generateUrl(emailer.email, emailer.name);
          });
        }

        return resolver;
      };

      return emailer;
    }

    return Emailer;
  })

  .factory('Email', function(inboxMailboxesService, emailSendingService, Emailer, _, Selectable) {

    function Email(email) {
      var isUnread = email.isUnread;

      Object.defineProperty(email, 'isUnread', {
        get: function() { return isUnread; },
        set: function(state) {
          if (isUnread !== state) {
            inboxMailboxesService.flagIsUnreadChanged(email, state);
            isUnread = state;
          }
        }
      });

      email.hasReplyAll = emailSendingService.showReplyAllButton(email);
      email.from = email.from && Emailer(email.from);
      email.to = _.map(email.to, Emailer);
      email.cc = _.map(email.cc, Emailer);
      email.bcc = _.map(email.bcc, Emailer);

      return Selectable(email);
    }

    return Email;
  })

  .factory('Thread', function(_, Selectable) {

    function _defineFlagProperty(object, flag) {
      Object.defineProperty(object, flag, {
        get: function() {
          return _.any(this.emails, flag);
        },
        set: function(state) {
          this.emails.forEach(function(email) {
            email[flag] = state;
          });
        }
      });
    }

    function Thread(thread, emails) {
      _defineFlagProperty(thread, 'isUnread');
      _defineFlagProperty(thread, 'isFlagged');

      thread.setEmails = function(emails) {
        thread.emails = emails || [];

        thread.mailboxIds = thread.emails.length ? thread.emails[0].mailboxIds : [];
        thread.subject = thread.emails.length ? thread.emails[0].subject : '';
        thread.lastEmail = _.last(thread.emails);
        thread.hasAttachment = !!(thread.lastEmail && thread.lastEmail.hasAttachment);
      };

      thread.setEmails(emails);

      return Selectable(thread);
    }

    return Thread;

  })

  .factory('Selectable', function($rootScope, INBOX_EVENTS) {
    function Selectable(item) {
      var isSelected = false;

      item.selectable = true;

      Object.defineProperty(item, 'selected', {
        enumerable: true,
        get: function() { return isSelected; },
        set: function(selected) {
          if (isSelected !== selected) {
            isSelected = selected;
            $rootScope.$broadcast(INBOX_EVENTS.ITEM_SELECTION_CHANGED, item);
          }
        }
      });

      return item;
    }

    return Selectable;
  })

  .factory('Mailbox', function($filter, inboxMailboxesCache, _, INBOX_DISPLAY_NAME_SIZE) {

    function getMailboxDescendants(mailboxId) {
      var descendants = [];
      var toScanMailboxIds = [mailboxId];
      var scannedMailboxIds = [];

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

    function Mailbox(mailbox) {
      var descendants;

      Object.defineProperty(mailbox, 'descendants', {
        configurable: true,
        get: function() {
          if (!descendants) {
            descendants = getMailboxDescendants(mailbox.id);
          }

          return descendants;
        }
      });

      Object.defineProperty(mailbox, 'displayName', {
        configurable: true,
        get: function() {
          var displayName = $filter('limitTo')(this.name, INBOX_DISPLAY_NAME_SIZE);

          if (this.name && this.name.length > INBOX_DISPLAY_NAME_SIZE) {
            displayName = displayName + '...';
          }

          return displayName;
        }
      });

      return mailbox;
    }

    return Mailbox;
  });
