'use strict';

angular.module('linagora.esn.unifiedinbox.ml')

  .run(function(dynamicDirectiveService, DynamicDirective, INBOX_ML_HEADERS) {
    var directive = new DynamicDirective(true, 'inbox-classification-message-indicator', {
      attributes: [
        { name: 'item', value: 'item' },
        { name: 'ng-if', value: 'item.headers["' + INBOX_ML_HEADERS.X_CLASSIFICATION_GUESS + '"]' }
      ]
    });

    dynamicDirectiveService.addInjection('inbox-message-indicators', directive);
  });
