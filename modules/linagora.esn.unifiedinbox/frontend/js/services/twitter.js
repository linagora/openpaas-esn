'use strict';

angular.module('linagora.esn.unifiedinbox')

  .factory('twitterAPI', function(inboxRestangular) {

    function getTweets(account, options) {
      var params = angular.extend({ account_id: account.data.id }, options);
      return inboxRestangular.one('inbox').customGETLIST('tweets', params);
    }

    return {
      getTweets: getTweets
    };
  });
