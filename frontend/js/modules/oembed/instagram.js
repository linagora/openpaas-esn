'use strict';

(function() {
  var regExps = [new RegExp('instagr\\.am/p/[\\w-]+', 'i'), new RegExp('instagram\\.com/p/[\\w-]+', 'i')];
  var endpoint = 'http://api.instagram.com/oembed';

  var IGService = function IGService(YQLService) {
    return {
      match: function(url) {
        return regExps.some(function(regexp) {
          if (url.match(regexp) !== null) {
            return true;
          }
          return false;
        });
      },

      // need to use YQL since calling from browser gives error like:
      // XMLHttpRequest cannot load http://api.instagram.com/oembed?format=json&url=http:%2F%2Finstagram.com%2Fp%2Fwb3xWlrf7C%2F.
      // The 'Access-Control-Allow-Origin' header has a value 'http://instagram.com' that is not equal to the supplied origin.
      // Origin 'http://localhost:8080' is therefore not allowed access.
      oembed: function(url) {
        return YQLService.get(endpoint, url);
      }
    };
  };
  IGService.$inject = ['YQLService'];

  var instagram = angular.module('esn.oembed.instagram', ['esn.oembed']);
  instagram.factory('instagramResolver', IGService);

  instagram.run(['oembedRegistry', function(oembedRegistry) {
    oembedRegistry.register('instagram', IGService);
  }]);

  instagram.directive('instagramOembed', ['instagramResolver', function(resolver) {
    return {
      restrict: 'E',
      replace: true,
      template: '<div class="oembed instagram-oembed"></div>',
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
