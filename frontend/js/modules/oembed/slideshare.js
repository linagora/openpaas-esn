'use strict';

(function() {
  var slideshare = angular.module('esn.oembed.slideshare', ['esn.oembed']);

  var templates = ['slideshare\\.net/[\\w-]+'];
  var provider = {
    name: 'slideshare',
    templates: templates,
    regexps: [new RegExp(templates[0], 'i')],
    endpoint: 'http://www.slideshare.net/api/oembed/2',
    type: 'rich',
    resolver: 'yql'
  };

  slideshare.run(['oembedRegistry', function(oembedRegistry) {
    oembedRegistry.addProvider(provider);
  }]);

  slideshare.directive('slideshareOembed', ['oembedResolver', 'oembedService', function(oembedResolver, oembedService) {
    return {
      restrict: 'E',
      replace: true,
      template: '<div class="oembed slideshare-oembed"></div>',
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
