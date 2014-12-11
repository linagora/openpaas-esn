'use strict';

(function() {

  var templates = ['youtube\\.com/watch.+v=[\\w-]+&?', 'youtu\\.be/[\\w-]+'];
  var endpoint = 'http://www.youtube.com/oembed';

  var Service = function Service(YQLService) {
    return {
      match: function(url) {
        return templates.some(function(regexp) {
          var r = new RegExp(regexp, 'i');
          if (url.match(r) !== null) {
            return true;
          }
          return false;
        });
      },

      oembed: function(url) {
        return YQLService.get(endpoint, url);
      }
    };
  };
  Service.$inject = ['YQLService'];

  var youtube = angular.module('esn.oembed.youtube', ['esn.oembed']);
  youtube.factory('youtubeResolver', Service);

  youtube.run(['oembedRegistry', function(oembedRegistry) {
    oembedRegistry.register('youtube', Service);
  }]);

  youtube.directive('youtubeOembed', ['youtubeResolver', function(youtubeResolver) {
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

        if (!youtubeResolver.match($scope.url)) {
          return;
        }

        youtubeResolver.oembed($scope.url, $scope.maxwidth, $scope.maxheight).then(
          function(oembed) {
            angular.element(oembed.html).appendTo($element[0]);
          },
          function(err) {
          }
        );
      }
    };
  }]);
})();
