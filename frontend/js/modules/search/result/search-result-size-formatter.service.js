(function(angular) {
  'use strict';

  angular.module('esn.search').factory('esnSearchResultSizeFormatter', esnSearchResultSizeFormatter);

  function esnSearchResultSizeFormatter(SIGNIFICANT_DIGITS) {
    return function(count) {

      if (!count) {
        return {
          hits: 0,
          isFormatted: false
        };
      }

      var searchResultFormattingLimit = Math.pow(10, SIGNIFICANT_DIGITS);

      if (count < searchResultFormattingLimit) {
        return {
          hits: count,
          isFormatted: false
        };
      }

      var len = Math.ceil(Math.log(count + 1) / Math.LN10);

      return {
        hits: Math.round(count * Math.pow(10, -(len - SIGNIFICANT_DIGITS))) * Math.pow(10, len - SIGNIFICANT_DIGITS),
        isFormatted: true
      };
    };
  }

})(angular);
