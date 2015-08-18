/*global O */

'use strict';

angular.module('esn.overture', [])
  .service('overture', function() {

    function createObservableArray(query, contentChangedCallback) {
      return new O.ObservableArray(null, {
        content: query,
        contentDidChange: function() {
          var mailboxes = this.get('content').get('[]');
          contentChangedCallback(mailboxes);
          return this.set('[]', mailboxes);
        }
      });
    }

    return {
      O: O,
      createObservableArray: createObservableArray
    };
  });
