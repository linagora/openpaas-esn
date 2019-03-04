(function(angular) {
  'use strict';

  angular.module('esn.search').factory('esnSearchQueryService', esnSearchQueryService);

  function esnSearchQueryService(_) {
    var searchKeepers = [];

    return {
      buildFromState: buildFromState,
      clear: clear,
      clearAdvancedQuery: clearAdvancedQuery,
      isEmpty: isEmpty,
      shouldKeepSearch: shouldKeepSearch,
      addSearchKeeper: addSearchKeeper
    };

    function addSearchKeeper(searchKeeper) {
      searchKeeper && searchKeepers.push(searchKeeper);
    }

    function shouldKeepSearch(toState, toParams, fromState, fromParams) {
      return searchKeepers.some(function(searchKeeper) {
        return searchKeeper(toState, toParams, fromState, fromParams);
      });
    }

    function buildFromState(stateParams) {
      var query = {};

      query.text = _.isEmpty(stateParams.q) ? '' : stateParams.q;
      query.advanced = _.isEmpty(stateParams.a) ? {} : stateParams.a;

      return query;
    }

    function clear(query) {
      !_.isEmpty(query.text) && (query.text = '');
      clearAdvancedQuery(query);

      return query;
    }

    function clearAdvancedQuery(query) {
      !_.isEmpty(query.advanced) && (query.advanced = {});

      return query;
    }

    function isEmpty(query) {
      return _.isEmpty(query) || (_.isEmpty(query.text) && _.isEmpty(query.advanced));
    }
  }
})(angular);
