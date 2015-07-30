'use strict';

/*global O */

angular.module('linagora.esn.unifiedinbox')

  .factory('ObservableArrayFactory', function() {
      return {
        create: function(query, contentChangedCallback) {
          return new O.ObservableArray(null, {
              content: query,
              contentDidChange: function() {
                  var mailboxes = this.get('content').get('[]');
                  contentChangedCallback(mailboxes);
                  return this.set('[]', mailboxes);
              }
          });
        }
      };
  });
