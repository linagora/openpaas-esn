'use strict';

(function() {
  var deezer = angular.module('esn.oembed.deezer', ['esn.oembed']);

  var templates = ['deezer\\.com/[\\w-]+'];
  var provider = {
    name: 'deezer',
    templates: templates,
    regexps: [new RegExp(templates[0], 'i')],
    endpoint: 'http://api.deezer.com/oembed',
    type: 'rich',
    resolver: 'yql'
  };

  deezer.run(['oembedRegistry', function(oembedRegistry) {
    oembedRegistry.addProvider(provider);
  }]);

  deezer.directive('deezerOembed', ['oembedResolver', 'oembedService', function(oembedResolver, oembedService) {
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
