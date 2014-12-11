'use strict';

(function() {

  var vimeo = angular.module('esn.oembed.vimeo', ['esn.oembed']);

  var provider = {
    name: 'vimeo',
    regexps: [new RegExp('vimeo\\.com/[\\w-]', 'i')],
    endpoint: 'http://vimeo.com/api/oembed.json',
    type: 'rich',
    resolver: 'yql'
  };

  vimeo.run(['oembedRegistry', function(oembedRegistry) {
    oembedRegistry.addProvider(provider);
  }]);

  vimeo.directive('vimeoOembed', ['oembedResolver', function(oembedResolver) {
    return {
      restrict: 'E',
      replace: true,
      template: '<div class="oembed vimeo-oembed"></div>',
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
