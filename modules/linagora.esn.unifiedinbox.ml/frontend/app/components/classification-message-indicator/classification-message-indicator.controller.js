(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox.ml')

    .controller('inboxClassificationMessageIndicatorController', function($q, jmap, inboxMailboxesService, inboxJmapItemService,
                                                                          inboxSelectionService, inboxMLConfig, _, INBOX_ML_HEADERS) {
      var self = this;

      self.$onChanges = $onChanges;
      self.moveItem = moveItem;

      /////

      function $onChanges(bindings) {
        var item = bindings.item.currentValue,
            classification = JSON.parse(item.headers[INBOX_ML_HEADERS.X_CLASSIFICATION_GUESS]);

        self.mailbox = null; // Because assignMailbox will not overwrite an existing value
        self.confidence = classification.confidence;

        $q.all({
          mailbox: inboxMailboxesService.assignMailbox(classification.mailboxId, self, true),
          inbox: inboxMailboxesService.getMailboxWithRole(jmap.MailboxRole.INBOX),
          config: inboxMLConfig.classification
        })
          .then(function(promises) {
            self.shouldBeDisplayed = promises.config.enabled && self.confidence >= promises.config.minConfidence && _.contains(self.item.mailboxIds, promises.inbox.id);
          });
      }

      function moveItem() {
        var item = self.item;

        inboxSelectionService.toggleItemSelection(item, false);

        return inboxJmapItemService.moveToMailbox(item, self.mailbox)
          .then(function() {
            return inboxMLConfig.classification;
          })
          .then(function(config) {
            if (config.markItemAsReadWhenMoving) {
              return inboxJmapItemService.markAsRead(item);
            }
          });
      }
    });

})();
