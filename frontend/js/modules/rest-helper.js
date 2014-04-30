'use strict';

angular.module('esn.rest.helper', [])
.factory('filteredcursor', function() {

  return function filteredcursor(cursor, limit, options) {

    var self = {
      endOfStream: false,
      offset: 0,
      running: false,
      error: false
    };

    var resultsBuffer = [];

    options = options ||  {};
    options.filter = options.filter || function(item) { return true; };

    function nextItems(callback) {
      if (self.error || self.running || self.endOfStream) {
        return;
      }

      self.running = true;

      function sendResponse() {
        var results = null;
        if (resultsBuffer.length >= limit) {
          results = resultsBuffer.splice(0, limit);
        } else if (cursor.endOfStream) {
          self.endOfStream = true;
          results = resultsBuffer;
          resultsBuffer = [];
        }

        if (results) {
          self.running = false;
          self.offset += results.length;
          callback(null, results);
          return true;
        }
        return false;
      }

      function recursiveFetch() {
        if (!sendResponse()) {
          cursor.nextItems(function(err, results) {
            if (err) {
              self.error = err;
              return callback(err);
            }
            var filtered = results.filter(options.filter);
            if (filtered.length) {
              resultsBuffer = resultsBuffer.concat(filtered);
            }
            recursiveFetch();
          });
        }
      }

      recursiveFetch();
    }

    self.nextItems = nextItems;
    return self;
  };



})
.factory('restcursor', function() {

  return function restcursor(api, limit, options) {
    var self = {
      endOfStream: false,
      offset: 0,
      running: false,
      error: false
    };

    options = options ||  {};
    options.apiArgs = options.apiArgs ||  {};
    options.updateApiArgs = options.updateApiArgs || function(cursor, items, apiArgs) {
      apiArgs.offset = cursor.offset;
    };

    function nextItems(callback) {
      if (self.running ||  self.endOfStream || self.error) {
        return false;
      }
      api(options.apiArgs).then(function(response) {
        var items = response.data;
        self.offset += items.length;
        options.updateApiArgs(self, items, options.apiArgs);
        if (items.length < limit) {
          self.endOfStream = true;
        }
        self.running = false;
        callback(null, items);
      }, function(response) {
        self.error = response.data ? response.data : response;
        self.running = false;
        callback(self.error);
      });
    }

    self.nextItems = nextItems;
    return self;
  };

});
