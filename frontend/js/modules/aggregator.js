'use strict';

angular.module('esn.aggregator', [
  'esn.constants',
  'esn.lodash-wrapper'
])

  .factory('PageAggregatorSourceWrapper', function($q) {
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

        return { id: self.source.id, lastPage: self.lastPage, data: result.data || [] };
      }, function(err) {
        self.lastPage = true;

        return $q.reject(err);
      });
    };

    PageAggregatorSourceWrapper.prototype.hasNext = function() {
      return !this.lastPage;
    };

    return PageAggregatorSourceWrapper;
  })

  .factory('PageAggregatorService', function($q, $log, PageAggregatorSourceWrapper, _,
                                             AGGREGATOR_DEFAULT_RESULTS_PER_PAGE, AGGREGATOR_DEFAULT_FIRST_PAGE_SIZE) {

    function PageAggregatorService(id, sources, options) {
      this.id = id;
      this.sources = sources;
      this.options = options || {};
      this.isFirstPage = true;

      if (!this.options.results_per_page) {
        this.options.results_per_page = AGGREGATOR_DEFAULT_RESULTS_PER_PAGE;
      }
      if (!this.options.first_page_size) {
        this.options.first_page_size = AGGREGATOR_DEFAULT_FIRST_PAGE_SIZE;
      }

      this.wrappedSources = sources.map(function(source) {
        return { source: new PageAggregatorSourceWrapper(source), data: [] };
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

        if (compare < 0) {
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
        }, function() {
          return $q.when({data: []});
        });
      }));
    };

    PageAggregatorService.prototype.loadNextItems = function() {

      var self = this;
      var result = [];
      var isFirstPage = self.isFirstPage;
      var pageSize = isFirstPage ? self.options.first_page_size : self.options.results_per_page;

      if (!this.hasNext()) {
        return $q.reject(new Error('No more data to fetch'));
      }

      function load() {
        return self._loadItemsFromSources().then(function() {
          var item = self._getSmallerItem();

          if (item) {
            result.push(item);
          }

          if (!self.hasNext() || result.length === pageSize) {
            return $q.when({ data: result });
          }

          return load();
        });
      }

      return load().then(function() {
        self.isFirstPage = false;

        return $q.when({
          id: self.id,
          firstPage: isFirstPage,
          lastPage: !self.hasNext(),
          data: result
        });
      });
    };

    PageAggregatorService.prototype.loadRecentItems = function() {
      var self = this;

      return $q.all(_(this.sources).filter('loadRecentItems').invoke('loadRecentItems').value())
        .then(function(resultsFromSources) {
          return _.flatten(resultsFromSources).sort(self.options.compare);
        });
    };

    PageAggregatorService.prototype.bidirectionalFetcher = function() {
      var self = this,
          fetcher = function() {
            return self.loadNextItems().then(_.property('data'));
          };

      fetcher.loadRecentItems = this.loadRecentItems.bind(this);

      return fetcher;
    };

    PageAggregatorService.prototype.hasNext = function() {
      return this._sourcesHaveData() || this._sourcesHaveNext();
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
