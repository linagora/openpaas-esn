'use strict';

angular.module('esn.array-helper', [])
  .factory('arrayHelper', function() {

    function sortHashArrayBy(array, field) {
      if (!array) {
        return [];
      }

      if (!field) {
        return array;
      }

      var result = [];
      angular.copy(array, result);

      result.sort(function(a, b) {
        var nameA = a[field] ? a[field].toUpperCase() : '';
        var nameB = b[field] ? b[field].toUpperCase() : '';
        return (nameA > nameB) - (nameB > nameA);
      });
      return result;
    }

    return {
      sortHashArrayBy: sortHashArrayBy
    };

  });
