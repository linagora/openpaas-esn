'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('inboxProviders', function() {
    var providers = {};

    return {
      add: function(name, provider) { providers[name] = provider; }
    };
  })

  .factory('inboxHostedMailProvider', function() {
    return {
      data: null,
      directive: '<inbox-message-list-item />'
    };
  });
