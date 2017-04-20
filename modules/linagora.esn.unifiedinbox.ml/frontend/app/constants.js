/**
 * This file cannot be named app.constants.js, though it deserves it, because Karma will load files in alphabetical order.
 */
(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox.ml')

    .constant('INBOX_ML_MODULE_NAME', 'linagora.esn.unifiedinbox.ml')

    .constant('INBOX_ML_CONFIGURATION', {
      classification: {
        ENABLED: 'enabled',
        MIN_CONFIDENCE: 'minConfidence',
        MARK_ITEM_AS_READ_WHEN_MOVING: 'markItemAsReadWhenMoving',
        SHOW_SUGGESTIONS_FOLDER: 'showSuggestionsFolder'
      }
    })

    .constant('INBOX_ML_DEFAULT_CONFIGURATIONS', {
      classification: {
        ENABLED: false,
        MIN_CONFIDENCE: 92,
        MARK_ITEM_AS_READ_WHEN_MOVING: true,
        SHOW_SUGGESTIONS_FOLDER: true
      }
    })

    .constant('INBOX_ML_HEADERS', {
      X_CLASSIFICATION_GUESS: 'X-Classification-Guess'
    })

    .constant('INBOX_SUGGESTIONS_MAILBOX', {
      id: 'suggestions',
      name: 'Suggestions',
      role: {
        value: 'suggestions'
      },
      icon: 'mdi mdi-lightbulb-outline',
      filter: {
        unprocessed: true,
        inMailboxes: ['inbox'],
        header: ['X-Classification-Guess']
      }
    });

})();
