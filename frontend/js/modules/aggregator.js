'use strict';

angular.module('esn.aggregator', [])

  .constant('AGGREGATOR_DEFAULT_RESULTS_PER_PAGE', 5)

  .factory('PageAggregatorSourceWrapper', function($q, $log) {
    function PageAggregatorSourceWrapper(source) {
      this.source = source;
      this.lastPage = false;
    }

    PageAggregatorSourceWrapper.prototype.loadNextItems = function(options) {
      var self = this;

      if (!this.hasNext()) {
        return $q.reject(new Error('No more pages on source ' + self.source.id));
      }

      return this.source.loadNextItems(options).then(function(result) {
        self.lastPage = !!result.lastPage;
        return {id: self.source.id, lastPage: self.lastPage, data: result.data || []};
      }, function(err) {
        $log.error('Fail to load new items', err);
        return $q.reject(new Error('Fail to load data from source ' + self.source.id));
      });
    };

    PageAggregatorSourceWrapper.prototype.hasNext = function() {
      return !this.lastPage;
    };

    return PageAggregatorSourceWrapper;
  })

  .factory('PageAggregatorService', function($q, $log, PageAggregatorSourceWrapper, AGGREGATOR_DEFAULT_RESULTS_PER_PAGE) {

    function PageAggregatorService(id, sources, options) {
      this.id = id;
      this.sources = sources;
      this.options = options || {results_per_page: AGGREGATOR_DEFAULT_RESULTS_PER_PAGE};
      if (!this.options.results_per_page) {
        this.options.results_per_page = AGGREGATOR_DEFAULT_RESULTS_PER_PAGE;
      }

      this.wrappedSources = sources.map(function(source) {
        return {source: new PageAggregatorSourceWrapper(source), data: []};
      });
    }

    PageAggregatorService.prototype._getSmallerItem = function() {
      var lowerIndex = 0;
      var self = this;

      var firstItems = this.wrappedSources.map(function(wrappedSource) {
        return wrappedSource.data[0];
      });

      if (!firstItems.length) {
        return;
      }

      if (firstItems.length === 1) {
        return this.wrappedSources[0].data.shift();
      }

      firstItems.reduce(function(previous, current, index) {

        var out;
        if (!current && previous) {
          return previous;
        }

        if (!current && !previous) {
          return;
        }

        if (current && !previous) {
          lowerIndex = index;
          return current;
        }

        var compare = self.options.compare(previous, current);

        if (compare === -1) {
          out = previous;
        } else {
          out = current;
          lowerIndex = index;
        }
        return out;
      });

      return this.wrappedSources[lowerIndex].data.shift();
    };

    PageAggregatorService.prototype._loadItemsFromSources = function() {
      return $q.all(this.wrappedSources.map(function(wrappedSource) {

        if (wrappedSource.data.length > 0) {
          return $q.when({data: wrappedSource.data});
        }

        return wrappedSource.source.loadNextItems().then(function(result) {
          if (result.data && result.data.length) {
            Array.prototype.push.apply(wrappedSource.data, result.data);
          }
          return $q.when({data: wrappedSource.data});
        }, function(err) {
          $log.debug(err.message || err);
          return $q.when({data: []});
        });
      }));
    };

    PageAggregatorService.prototype.loadNextItems = function() {

      var self = this;
      var result = [];

      if (!this.hasNext()) {
        return $q.reject(new Error('No more data to fetch'));
      }

      function load() {
        return self._loadItemsFromSources().then(function() {

          var item = self._getSmallerItem();
          if (item) {
            result.push(item);
          }

          if (!self._sourcesHaveData() || result.length === self.options.results_per_page) {
            return $q.when({data: result});
          }
          return load();
        });
      }

      return load().then(function() {
        return $q.when({
          id: self.id,
          lastPage: !self.hasNext(),
          data: result
        });
      });
    };

    PageAggregatorService.prototype.hasNext = function() {
      return this._sourcesHaveData() || this._sourcesHaveNext();
    };

    PageAggregatorService.prototype._sourcesHaveNext = function() {
      return this.wrappedSources.some(function(wrappedSource) {
        return wrappedSource.source.hasNext();
      });
    };

    PageAggregatorService.prototype._sourcesHaveData = function() {
      return this.wrappedSources.some(function(source) {
        return source.data.length;
      });
    };

    return PageAggregatorService;
  });
