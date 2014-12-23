'use strict';

(function() {

  var youtube = angular.module('esn.oembed.youtube', ['esn.oembed']);

  var provider = {
    name: 'youtube',
    regexps: [new RegExp('youtube\\.com/watch.+v=[\\w-]+&?', 'i'), new RegExp('youtu\\.be/[\\w-]+', 'i')],
    endpoint: 'http://www.youtube.com/oembed',
    type: 'rich',
    resolver: 'yql'
  };

  youtube.run(['oembedRegistry', function(oembedRegistry) {
    oembedRegistry.addProvider(provider);
  }]);

  youtube.directive('youtubeOembed', ['oembedResolver', 'oembedService', function(oembedResolver, oembedService) {
    return {
      restrict: 'E',
      replace: true,
      template: '<div class="oembed youtube-oembed"></div>',
      scope: {
        url: '@',
        maxwidth: '=',
        maxheight: '='
      },
      link: function($scope, $element) {
        oembedResolver[provider.resolver](provider.endpoint, $scope.url, $scope.maxwidth, $scope.maxheight).then(
          function(oembed) {
            angular.element(oembedService.fixHttpLinks(oembed.html)).appendTo($element[0]);
          },
          function(err) {
          }
        );
      }
    };
  }]);
})();
