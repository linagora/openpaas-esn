(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .run(function(jmap, inboxMakeSelectable, inboxMailboxesService, emailSendingService) {
      Object.defineProperties(jmap.Message.prototype, {
        isUnread: {
          configurable: true,
          get: function() { return this._isUnread; },
          set: function(isUnread) {
            if (this._isUnread !== isUnread) {
              if (angular.isDefined(this._isUnread)) {
                inboxMailboxesService.flagIsUnreadChanged(this, isUnread);
              }

              this._isUnread = isUnread;
            }
          }
        },
        hasReplyAll: {
          enumerable: true,
          configurable: true,
          get: function() {
            return emailSendingService.showReplyAllButton(this);
          }
        }
      });

      inboxMakeSelectable(jmap.Message.prototype);
    });

})();
