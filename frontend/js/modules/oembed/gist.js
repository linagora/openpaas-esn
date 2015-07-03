'use strict';

(function() {
  var gist = angular.module('esn.oembed.gist', ['esn.oembed', 'gist']);

  var provider = {
    name: 'gist',
    regexps: [new RegExp('gist.github.com\/[a-zA-Z0-9_-]+\/([a-zA-Z0-9]+)', 'i')],
    resolver: 'local'
  };

  gist.run(function(oembedRegistry) {
    oembedRegistry.addProvider(provider);
  });

  gist.directive('gistOembed', function(oembedResolver, oembedService, $compile, $timeout) {
    return {
      restrict: 'E',
      replace: true,
      template: '<div class="oembed gist-oembed"></div>',
      scope: {
        url: '@',
        maxwidth: '=',
        maxheight: '='
      },

      link: function($scope, $element) {
        $scope.gistId = $scope.url.split('/')[4];
        $timeout(function() {
          var gistDirective = angular.element('<gist id={{gistId}}></div>');
          $element.append(gistDirective);
          $compile(gistDirective)($scope);
        }, 0);
      }
    };
  });
})();
