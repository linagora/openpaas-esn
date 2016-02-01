'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('Email', function(mailboxesService) {

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
