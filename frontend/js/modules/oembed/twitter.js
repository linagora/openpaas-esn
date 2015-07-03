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

        var tweetId = $scope.url.split('/').pop();
        if (!tweetId) {
          return;
        }

        twitterWidgetService.widgets.createTweet(
          tweetId,
          $element[0]
        );
      }
    };
  });
})();
