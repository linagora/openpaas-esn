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

        if (!a[field] && !b[field]) {
          return 0;
        }

        if (a[field] && !b[field]) {
          return 1;
        }

        if (!a[field] && b[field]) {
          return -1;
        }

        var nameA = a[field].toUpperCase();
        var nameB = b[field].toUpperCase();
        if (nameA < nameB) {
          return -1;
        }

        if (nameA > nameB) {
          return 1;
        }

        return 0;
      });
      return result;
    }

    return {
      sortHashArrayBy: sortHashArrayBy
    };

  });
