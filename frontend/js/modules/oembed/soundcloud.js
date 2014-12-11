'use strict';

(function() {

  var templates = ['soundcloud\\.com/[\\w-]+'];
  var regExps = [new RegExp(templates[0], 'i')];
  var endpoint = 'http://soundcloud.com/oembed';

  var SCService = function SCService($http) {
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
        return $http.get(endpoint, {params: {format: 'json', url: url}}).then(function(response) {
          return response.data;
        });
      }
    };
  };
  SCService.$inject = ['$http'];

  var soundcloud = angular.module('esn.oembed.soundcloud', ['esn.oembed']);
  soundcloud.factory('soundcloudResolver', SCService);

  soundcloud.run(['oembedRegistry', function(oembedRegistry) {
    oembedRegistry.register('soundcloud', SCService);
  }]);

  soundcloud.directive('soundcloudOembed', ['soundcloudResolver', function(resolver) {
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
