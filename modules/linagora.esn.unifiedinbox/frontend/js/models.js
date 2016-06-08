'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('Emailer', function(searchService, INBOX_DEFAULT_AVATAR) {
    function Emailer(emailer) {
      var resolver;

      emailer.resolve = function() {
        if (!resolver) {
          resolver = searchService.searchByEmail(emailer.email).then(function(result) {
            emailer.name = result && result.displayName || emailer.name;
            emailer.avatarUrl = result && result.photo || INBOX_DEFAULT_AVATAR;
          });
        }

        return resolver;
      };

      return emailer;
    }

    return Emailer;
  })

  .factory('Email', function(mailboxesService, emailSendingService, Emailer, _) {

    function Email(email) {
      var isUnread = email.isUnread;

      Object.defineProperty(email, 'isUnread', {
        get: function() { return isUnread; },
        set: function(state) {
          if (isUnread !== state) {
            mailboxesService.flagIsUnreadChanged(email, state);
            isUnread = state;
          }
        }
      });

      email.hasReplyAll = emailSendingService.showReplyAllButton(email);
      email.from = email.from && Emailer(email.from);
      email.to = _.map(email.to, Emailer);
      email.cc = _.map(email.cc, Emailer);
      email.bcc = _.map(email.bcc, Emailer);

      return email;
    }

    return Email;
  })

  .factory('Thread', function(_) {

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
      thread.subject = emails && emails[0] ? emails[0].subject : '';
      thread.emails = emails || [];
      thread.lastEmail = _.last(thread.emails);

      _defineFlagProperty(thread, 'isUnread');
      _defineFlagProperty(thread, 'isFlagged');

      return thread;
    }

    return Thread;

  });
