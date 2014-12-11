'use strict';

(function() {

  var templates = ['vimeo\\.com/[\\w-]'];
  var endpoint = 'http://vimeo.com/api/oembed.json';

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

      oembed: function(url, maxwidth, maxheight) {
        return YQLService.get(endpoint, url, maxwidth, maxheight);
      }
    };
  };
  Service.$inject = ['YQLService'];

  var vimeo = angular.module('esn.oembed.vimeo', ['esn.oembed']);
  vimeo.factory('vimeoResolver', Service);

  vimeo.run(['oembedRegistry', function(oembedRegistry) {
    oembedRegistry.register('vimeo', Service);
  }]);

  vimeo.directive('vimeoOembed', ['vimeoResolver', function(vimeoResolver) {
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

        if (!vimeoResolver.match($scope.url)) {
          return;
        }

        vimeoResolver.oembed($scope.url, $scope.maxwidth, $scope.maxheight).then(
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
