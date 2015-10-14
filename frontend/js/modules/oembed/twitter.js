'use strict';

(function() {
  var twitter = angular.module('esn.oembed.twitter', ['esn.oembed', 'esn.twitter']);

  var provider = {
    name: 'twitter',
    regexps: [new RegExp('twitter\\.com/[\\w-]+/status/[\\w-]+', 'i')]
  };

  twitter.run(function(oembedRegistry) {
    oembedRegistry.addProvider(provider);
  });

  twitter.directive('twitterOembed', function(oembedResolver, twitterWidgetService) {
    return {
      restrict: 'E',
      replace: true,
      template: '<div class="oembed twitter-oembed"></div>',
      scope: {
        url: '@',
        maxwidth: '=',
        maxheight: '='
      },
      link: function($scope, $element) {

        function parseTweetId() {
          var tweetId = $scope.url.split('/').pop();
          if (!tweetId) {
            return null;
          }
          // a trailing ?s=blabla is sometimes included in a tweet url
          return tweetId.split('?').shift();
        }

        var tweetId = parseTweetId();
        if (tweetId) {
          twitterWidgetService.widgets.createTweet(
            tweetId,
            $element[0]
          );
        }
      }
    };
  });
})();
