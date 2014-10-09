'use strict';

angular.module('esn.paginate', [])
.factory('paginator', function() {
    return function(itemsPerPage, loader) {
      var currentPage = 0;
      return {
        currentPage: function(callback) {
          loader.getItems(currentPage * itemsPerPage, itemsPerPage, function(err, items, size) {
            //return callback(err, items, size, currentPage * itemsPerPage);
            return callback(err, items, size, currentPage);

          });
        },
        nextPage: function(callback) {
          var page = ++currentPage;
          loader.getItems(page * itemsPerPage, itemsPerPage, function(err, items, size) {
            //return callback(err, items, size, page * itemsPerPage);
            return callback(err, items, size, page);
          });
        },
        previousPage: function(callback) {
          var page = --currentPage;
          loader.getItems(page * itemsPerPage, itemsPerPage, function(err, items, size) {
            //return callback(err, items, size, page * itemsPerPage);
            return callback(err, items, size, page);
          });
        }
      }
    }
  });
