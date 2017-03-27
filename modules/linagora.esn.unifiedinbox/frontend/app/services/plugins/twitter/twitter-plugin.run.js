(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .run(function($q, inboxPlugins, _, PROVIDER_TYPES) {
      inboxPlugins.add({
        type: PROVIDER_TYPES.TWITTER,
        getEmptyContextTemplateUrl: _.constant($q.when('/unifiedinbox/app/services/plugins/twitter/twitter-empty-message.html'))
      });
    });

})();
