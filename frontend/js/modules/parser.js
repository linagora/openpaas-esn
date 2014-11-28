'use strict';

angular.module('esn.parser', ['ngSanitize'])
  .factory('parserResolver', ['$q', function($q) {

    var parsers = {};

    function register(parserName, resolver) {
      if (!parserName) {
        throw new Error('ParserName can not be null');
      }

      if (!resolver) {
        throw new Error('Resolver can not be null');
      }

      if (!angular.isFunction(resolver)) {
        throw new Error('Resolver must be a function');
      }

      parsers[parserName] = resolver;
    }

    function resolve(parser, text) {
      if (!parser) {
        return $q.reject(new Error(parser + ' is not a valid parser name'));
      }

      if (!text) {
        return $q.reject(new Error('Text to parse is required'));
      }

      var resolver = parsers[parser];

      if (!resolver) {
        return $q.reject(new Error(parser + ' is not a registered parser'));
      }

      return resolver(text);
    }

    /**
     * Resolve the text by parsing it with all parsers.
     * The text to parse is given to parsers in the array order.
     * The input of a parser is the output of the previous parser or the given text for the first parser.
     * The list of parsers must be :
     * [
     *    {name: 'markdown'},
     *    {name: 'parser2'},
     *    ...
     * ]
     *
     * @param {object[]} parsers the list of parsers
     * @param {string} text the text to parse
     * @return {object} a promise with the final parsed text
     */
    function resolveChain(parsers, text) {
      if (!parsers) {
        return $q.reject(new Error('Parsers is required'));
      }
      if (!Array.isArray(parsers)) {
        return $q.reject(new Error('Parsers must be an array'));
      }
      if (!text) {
        return $q.reject(new Error('Text is required'));
      }

      function onResult(result) {
        if (parsers.length) {
          var parser = parsers.shift();
          return resolve(parser.name, result).then(onResult);
        } else {
          return $q.when(result);
        }
      }

      return $q.when(text).then(onResult);
    }

    return {
      register: register,
      resolve: resolve,
      resolveChain: resolveChain
    };
  }])
  .directive('textParser', ['parserResolver', '$log', '$filter', function(parserResolver, $log, $filter) {
    return {
      restrict: 'E',
      link: function($scope, element, attrs) {
        var parsers = attrs.parsers ? JSON.parse(attrs.parsers) : attrs.parsers;
        var text = attrs.text;
        if (!parsers || parsers.length === 0) {
          return element.html($filter('linky')(text, '_blank'));
        }
        parserResolver.resolveChain(parsers, text).then(function(result) {
          element.html(result);
        }, function(err) {
          $log.error('The text is displayed without modification : ', err);
          element.html(text);
        });
      }
    };
  }]);
