'use strict';

(function() {

  var soundcloud = angular.module('esn.oembed.soundcloud', ['esn.oembed']);

  var provider = {
    name: 'soundcloud',
    regexps: [new RegExp('soundcloud\\.com/[\\w-]+', 'i')],
    endpoint: '//soundcloud.com/oembed',
    type: 'rich',
    resolver: 'http'
  };

  soundcloud.run(['oembedRegistry', function(oembedRegistry) {
    oembedRegistry.addProvider(provider);
  }]);

  soundcloud.directive('soundcloudOembed', ['oembedResolver', 'oembedService', function(oembedResolver, oembedService) {
    return {
      restrict: 'E',
      replace: true,
      template: '<div class="oembed soundcloud-oembed"></div>',
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
