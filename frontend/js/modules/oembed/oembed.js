'use strict';

angular.module('esn.oembed', [])
  .directive('oembeds', ['$compile', '$log', 'oembedService', function($compile, $log, oembedService) {
    return {
      restrict: 'E',
      scope: {
        message: '=',
        maxwidth: '=',
        maxheight: '='
      },
      link: function($scope, $element) {

        if (!$scope.message || $scope.message.length === 0) {
          $log.debug('Can not process oembed for empty text');
          return;
        }

        oembedService.getLinks($scope.message).forEach(function(link) {
          $log.debug('Processing oembed for link', link);
          var oembed = oembedService.getProvider(link);
          if (oembed) {
            var e = $('<' + oembed.name + '-oembed></' + oembed.name + '-oembed>');
            e.attr({url: link, maxwidth: $scope.maxwidth, maxheight: $scope.maxheight});
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
  .factory('oembedService', ['$log', 'oembedRegistry', function($log, oembedRegistry) {
    function getLinks(text) {
      var source = (text || '').toString();
      var urlArray = [];
      var matchArray;

      var regexToken = /(((https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)/g;

      while ((matchArray = regexToken.exec(source)) !== null) {
        var token = matchArray[0];
        urlArray.push(token);
      }

      return urlArray;
    }

    function validate(url, regExps) {
      return regExps.some(function(regexp) {
        if (url.match(regexp) !== null) {
          return true;
        }
        return false;
      });
    }

    function getProvider(url) {
      var providers = oembedRegistry.getProviders();
      for (var key in providers) {
        if (validate(url, providers[key].regexps)) {
          return providers[key];
        } else {
          $log.debug('URL ' + url + ' does not match the provider ' + key);
        }
      }
      return null;
    }

    return {
      getLinks: getLinks,
      getProvider: getProvider
    };
  }])
  .factory('oembedRegistry', ['$log', function($log) {
    var providers = {};

    return {
      /**
       *  {provider: 'name', regexps: [RegExp], endpoint: 'http://provider/endpoint'}
       */
      addProvider: function(provider) {
        if (provider && !providers[provider.name]) {
          providers[provider.name] = provider;
        }
      },

      getProviders: function() {
        return providers;
      }
    };
  }])
  .factory('oembedResolver', ['$http', function($http) {
    return {

      yql: function(oembed, url, width, height) {
        var q = 'select * from json where url ="' + oembed + '?url=' + url;
        if (width) {
          q = q + '&maxwidth=' + width;
        }
        if (height) {
          q = q + '&maxheight=' + height;
        }
        q = q + '"';

        return $http.get('//query.yahooapis.com/v1/public/yql', {
          params: {
            q: q,
            format: 'json'
          }
        }).then(function(response) {
          if (response.data.query.count > 0) {
            return response.data.query.results.json;
          } else {
            return {};
          }
        });
      },

      http: function(oembed, url, width, height) {
        return $http.get(oembed, {
          params: {
            format: 'json',
            maxwidth: width,
            maxheight: height,
            url: url
          }
        }).then(function(response) {
          return response.data;
        });
      }
    };
  }]);
