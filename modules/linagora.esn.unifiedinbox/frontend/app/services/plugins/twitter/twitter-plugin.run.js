(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .run(function($q, session, inboxPlugins, _, PROVIDER_TYPES) {
      inboxPlugins.add({
        type: PROVIDER_TYPES.TWITTER,
        contextSupportsAttachments: _.constant($q.when(false)),
        resolveContextName: function(account) {
          return $q.when('@' + _.find(session.getProviderAccounts(PROVIDER_TYPES.TWITTER), { id: account }).username);
        },
        getEmptyContextTemplateUrl: _.constant($q.when('/unifiedinbox/app/services/plugins/twitter/twitter-empty-message.html'))
      });
    });

})();
