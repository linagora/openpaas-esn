'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('Email', function(mailboxesService, searchService, _, INBOX_DEFAULT_AVATAR) {

    function resolveEmailer(emailer) {
      if (!emailer) {
        return;
      }

      searchService.searchByEmail(emailer.email).then(function(result) {
        emailer.name = result && result.displayName || emailer.name;
        emailer.avatarUrl = result && result.photo || INBOX_DEFAULT_AVATAR;
      });
    }

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

      resolveEmailer(email.from);
      _.forEach(email.to, resolveEmailer);
      _.forEach(email.cc, resolveEmailer);
      _.forEach(email.bcc, resolveEmailer);

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

      _defineFlagProperty(thread, 'isUnread');
      _defineFlagProperty(thread, 'isFlagged');

      return thread;
    }

    return Thread;

  });
