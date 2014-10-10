'use strict';

angular.module('esn.paginate', [])
  .factory('paginator', function() {

    return function(itemsPerPage, loader) {

      if (!loader) {
        throw new Error('Loader is required');
      }

      var currentPage = 0;
      var cache = {
        items: []
      };
      itemsPerPage = itemsPerPage || 1;

      return {
        currentPage: function(callback) {
          loader.getItems(currentPage * itemsPerPage, itemsPerPage, function(err, items, size) {
            cache.items = items || [];
            return callback(err, items, size, currentPage);
          });
        },
        nextPage: function(callback) {
          var page = ++currentPage;
          loader.getItems(page * itemsPerPage, itemsPerPage, function(err, items, size) {
            cache.items = items || [];
            return callback(err, items, size, page);
          });
        },
        previousPage: function(callback) {
          var page = --currentPage;
          loader.getItems(page * itemsPerPage, itemsPerPage, function(err, items, size) {
            cache.items = items || [];
            return callback(err, items, size, page);
          });
        },
        getItems: function() {
          return cache.items;
        }
      };
    };
  });
