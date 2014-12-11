'use strict';

(function() {
  var instagram = angular.module('esn.oembed.instagram', ['esn.oembed']);

  var provider = {
    name: 'instagram',
    regexps: [new RegExp('instagr\\.am/p/[\\w-]+', 'i'), new RegExp('instagram\\.com/p/[\\w-]+', 'i')],
    endpoint: 'http://api.instagram.com/oembed',
    type: 'rich',
    resolver: 'yql'
  };

  instagram.run(['oembedRegistry', function(oembedRegistry) {
    oembedRegistry.addProvider(provider);
  }]);

  instagram.directive('instagramOembed', ['oembedResolver', function(oembedResolver) {
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
        oembedResolver[provider.resolver](provider.endpoint, $scope.url, $scope.maxwidth, $scope.maxheight).then(
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
