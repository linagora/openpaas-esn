'use strict';

(function() {

  var codepen = angular.module('esn.oembed.codepen', ['esn.oembed']);

  var provider = {
    name: 'codepen',
    regexps: [new RegExp('codepen\\.io/[\\w-]+', 'i')],
    endpoint: 'http://codepen.io/api/oembed',
    type: 'rich',
    resolver: 'yql',
    format: 'json'
  };

  codepen.run(['oembedRegistry', function(oembedRegistry) {
    oembedRegistry.addProvider(provider);
  }]);

  codepen.directive('codepenOembed', ['oembedResolver', 'oembedService', function(oembedResolver, oembedService) {
    return {
      restrict: 'E',
      replace: true,
      template: '<div class="oembed codepen-oembed"></div>',
      scope: {
        url: '@',
        maxwidth: '=',
        maxheight: '='
      },
      link: function($scope, $element) {
        oembedResolver[provider.resolver](provider, $scope.url, $scope.maxwidth, $scope.maxheight).then(
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
