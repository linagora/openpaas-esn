(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .run(function(jmap, inboxMakeSelectable, _) {
      function _defineFlagProperty(flag) {
        Object.defineProperty(jmap.Thread.prototype, flag, {
          configurable: true,
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

      function _defineLastEmailProperty(property, defaultValue) {
        Object.defineProperty(jmap.Thread.prototype, property, {
          configurable: true,
          get: function() {
            return (this.lastEmail && this.lastEmail[property]) || defaultValue;
          }
        });
      }

      Object.defineProperties(jmap.Thread.prototype, {
        mailboxIds: {
          configurable: true,
          get: function() {
            return _(this.emails).pluck('mailboxIds').flatten().uniq().value();
          }
        },
        lastEmail: {
          configurable: true,
          get: function() {
            return _.last(this.emails);
          }
        }
      });

      _defineLastEmailProperty('subject', '');
      _defineLastEmailProperty('date');
      _defineLastEmailProperty('hasAttachment', false);
      _defineFlagProperty('isUnread');
      _defineFlagProperty('isFlagged');

      inboxMakeSelectable(jmap.Thread.prototype);
    });

})();
