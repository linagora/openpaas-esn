'use strict';

angular.module('esn.oembed', [])
  .directive('oembeds', ['$compile', '$log', 'oembedService', function($compile, $log, oembedService) {
    return {
      restrict: 'E',
      scope: {
        message: '=',
        width: '=',
        height: '='
      },
      link: function($scope, $element) {

        if (!$scope.message || $scope.message.length === 0) {
          $log.debug('Can not process oembed for empty text');
          return;
        }

        oembedService.getLinks($scope.message).forEach(function(link) {
          $log.debug('Processing oembed for link', link);
          var oembed = oembedService.getOEmbedProvider(link);
          if (oembed) {
            var e = $('<' + oembed.provider + '-oembed></' + oembed.provider + '-oembed>');
            e.attr({url: link, width: $scope.width || 800, height: $scope.height || 600});
            var template = angular.element(e);
            var newElt = $compile(template)($scope);
            $element.append(newElt);
          } else {
            $log.debug('No oembed provider found for', link);
          }
        });
      }
    };
  }])
  .factory('oembedService', ['oembedRegistry', function(oembedRegistry) {
    return {
      getLinks: function getLinks(text) {
        var source = (text || '').toString();
        var urlArray = [];
        var matchArray;

        // Regular expression to find FTP, HTTP(S) and email URLs.
        var regexToken = /(((https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)/g;

        // Iterate through any URLs in the text.
        while ((matchArray = regexToken.exec(source)) !== null) {
          var token = matchArray[0];
          urlArray.push(token);
        }

        return urlArray;
      },

      getOEmbedProvider: function(link) {
        return oembedRegistry.getHandler(link);
      }
    };
  }])
  .factory('oembedRegistry', ['$log', function($log) {
    var handlers = [];

    return {
      register: function register(name, handler) {
        if (name && handler) {
          handlers.push({provider: name, handler: handler});
        }
      },

      getHandler: function getHandler(url) {
        for (var i = 0; i < handlers.length; i++) {
          if (handlers[i].handler().match(url)) {
            return handlers[i];
          } else {
            $log.debug('URL does not match the provider', url);
          }
        }
        return null;
      }
    };
  }])
  .factory('YQLService', ['$http', function($http) {
    return {
      get: function(oembed, url, width, height) {
        return $http.get('http://query.yahooapis.com/v1/public/yql', {
          params: {
            q: 'select * from json where url ="' + oembed + '?url=' + url + '"',
            format: 'json'
          }
        }).then(function(response) {
          if (response.data.query.count > 0) {
            return response.data.query.results.json;
          } else {
            return {};
          }
        });
      }
    };
  }]);
