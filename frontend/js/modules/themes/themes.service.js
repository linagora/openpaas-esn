(function(angular) {
  'use strict';

  angular.module('esn.themes').factory('themesService', themesService);

  function themesService(esnRestangular, _) {
    var functions = {
      saveTheme: saveTheme,
      getTheme: getTheme
    };

    var service = angular.copy(functions);
    service.forDomain = forDomain;

    return service;

    function forDomain(domainId) {
      var bound = {};
      for(var key in functions) { // eslint-disable-line
        bound[key] = _.partial(functions[key], domainId);
      }

      return bound;
    }

    function saveTheme(domainId, newTheme) {
      return _getRestangular(domainId).customPUT(newTheme, '', {}, {});
    }

    function getTheme(domainId) {
      return _getRestangular(domainId).get().then(function(result) {
        return {colors: result.data.colors || {}, logos: result.data.logos || {}};
      });
    }

    function _getRestangular(domainId) {
      return esnRestangular.one('themes', domainId);
    }
  }
})(angular);
