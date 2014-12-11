'use strict';

(function() {

  var templates = ['deezer\\.com/[\\w-]+'];
  var regExps = [new RegExp(templates[0], 'i')];
  var endpoint = 'http://api.deezer.com/oembed';

  var DeezerService = function DeezerService(YQLService) {
    return {
      match: function(url) {
        return regExps.some(function(regexp) {
          if (url.match(regexp) !== null) {
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
  DeezerService.$inject = ['YQLService'];

  var deezer = angular.module('esn.oembed.deezer', ['esn.oembed']);
  deezer.factory('deezerResolver', DeezerService);

  deezer.run(['oembedRegistry', function(oembedRegistry) {
    oembedRegistry.register('deezer', DeezerService);
  }]);

  deezer.directive('deezerOembed', ['deezerResolver', function(resolver) {
    return {
      restrict: 'E',
      replace: true,
      template: '<div class="oembed deezer-oembed"></div>',
      scope: {
        url: '@',
        maxwidth: '=',
        maxheight: '='
      },
      link: function($scope, $element) {

        if (!resolver.match($scope.url)) {
          return;
        }

        resolver.oembed($scope.url, $scope.maxwidth, $scope.maxheight).then(
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
