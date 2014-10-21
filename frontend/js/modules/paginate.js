'use strict';

angular.module('esn.paginate', [])
  .factory('paginator', function() {

    return function(items, itemsPerPage, totalItems, loader) {

      if (!loader) {
        throw new Error('Loader is required');
      }

      var currentPage = 1;
      var cache = { items: items };
      itemsPerPage = itemsPerPage || 1;
      totalItems = totalItems || 1;
      var lastPage = Math.ceil(totalItems / itemsPerPage);
      var lastPageInCache = Math.ceil(items.length / itemsPerPage);

      return {
        cache: cache,
        offset: 0,
        limit: itemsPerPage,
        totalItems: totalItems,
        lastPageInCache: lastPageInCache,
        lastPage: lastPage,
        currentPage: function(callback) {
          loader.getItems(this.cache.items, this.offset, this.limit, function(err, items) {
            return callback(err, items, currentPage);
          });
        },
        nextPage: function(callback) {
          currentPage++;
          this.offset += this.limit;
          loader.getItems(this.cache.items, this.offset, this.limit, function (err, items) {
            return callback(err, items, currentPage);
          });
        },
        previousPage: function(callback) {
          currentPage--;
          this.offset -= this.limit;
          loader.getItems(this.cache.items, this.offset, this.limit, function(err, items) {
            return callback(err, items, currentPage);
          });
        },
        loadNextItems: function(callback) {
          var self = this;
          loader.loadNextItems(function(err, items) {
            if (!items || items && !items.length) {
              return callback(err);
            }
            self.cache.items = self.cache.items.concat(items);
            self.lastPageInCache += Math.ceil(items.length / self.limit);
            callback(err);
          });
        }
      };
    };
  });
