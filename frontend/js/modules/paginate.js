'use strict';

angular.module('esn.paginate', [])
  .factory('paginator', function() {

    return function(items, itemsPerPage, totalItems, loader) {

      if (!loader) {
        throw new Error('Loader is required');
      }

      itemsPerPage = itemsPerPage || 1;
      totalItems = totalItems || 1;

      var currentPage = 1;
      var cache = { items: items };

      var lastPage = Math.ceil(totalItems / itemsPerPage);
      var lastPageInCache = Math.ceil(items.length / itemsPerPage);

      var offset = 0;
      var limit = itemsPerPage;
      var total = totalItems;

      return {
        currentPage: function(callback) {
          loader.getItems(cache.items, offset, limit, function(err, items) {
            return callback(err, items, currentPage);
          });
        },
        nextPage: function(callback) {
          currentPage++;
          offset += limit;
          var self = this;
          loader.getItems(cache.items, offset, limit, function(err, items) {
            if (lastPageInCache !== lastPage && currentPage === lastPageInCache) {
              self.loadNextItems(function(err) {
                return callback(err, items, currentPage);
              });
            } else {
              return callback(err, items, currentPage);
            }
          });
        },
        previousPage: function(callback) {
          currentPage--;
          offset -= limit;
          loader.getItems(cache.items, offset, limit, function(err, items) {
            return callback(err, items, currentPage);
          });
        },
        loadNextItems: function(callback) {
          loader.loadNextItems(function(err, items) {
            if (!items || items && !items.length) {
              return callback(err);
            }
            cache.items = cache.items.concat(items);
            lastPageInCache += Math.ceil(items.length / limit);
            callback(err);
          });
        },
        getItems: function() {
          return cache.items;
        },
        getTotalItems: function() {
          return total;
        },
        getLastPage: function() {
          return lastPage;
        },
        getLastPageInCache: function() {
          return lastPageInCache;
        }
      };
    };
  });
