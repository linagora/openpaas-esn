(function(angular) {
  'use strict';

  angular.module('esn.timeline').factory('TimelinePaginationProvider', TimelinePaginationProvider);

  function TimelinePaginationProvider(esnTimelineAPI) {

    function TimelinePaginationProvider(options) {
      this.options = angular.extend({limit: 20, offset: 0}, {}, options);
    }

    TimelinePaginationProvider.prototype.loadNextItems = function() {
      var self = this;

      return esnTimelineAPI.getUserTimelineEntries(self.options).then(function(response) {
        var result = {
          data: response.data,
          lastPage: (response.data.length < self.options.limit)
        };

        if (!result.lastPage) {
          self.options.offset += self.options.limit;
        }

        return result;
      });
    };

    return TimelinePaginationProvider;
  }
})(angular);
