'use strict';

angular.module('esn.cache', [
  'esn.constants'
])

  .constant('CACHE_NO_TTL', -1)

  .factory('CacheEntry', function($q, CACHE_NO_TTL) {

    function CacheEntry(ttl) {
      this.ttl = ttl || CACHE_NO_TTL;
      this.value = $q.defer();
    }

    CacheEntry.prototype.put = function(value) {
      this.now = Date.now();
      this.value.resolve(value);
    };

    CacheEntry.prototype.get = function() {
      return this.value.promise;
    };

    CacheEntry.prototype.isExpired = function() {
      if (this.ttl === CACHE_NO_TTL || !this.now) {
        return false;
      }

      return Date.now() - this.now > this.ttl;
    };

    return CacheEntry;

  })

  .factory('Cache', function($q, CacheEntry, CACHE_NO_TTL) {

    function Cache(options) {
      this.options = options;

      if (!this.options.loader) {
        throw new Error('Data loader is required');
      }

      this.loader = this.options.loader;
      this.getKey = this.options.keyBuilder || function(key) {return key;};
      this.ttl = this.options.ttl || CACHE_NO_TTL;
      this.entries = {};
      this.loading = {};
    }

    Cache.prototype.exists = function(key) {
      return !!this.entries[this.getKey(key)];
    };

    Cache.prototype.isExpired = function(key) {
      var k = this.getKey(key);

      if (!this.exists(k)) {
        return false;
      }
      return this.entries[k].isExpired();
    };

    Cache.prototype.get = function(key) {
      var self = this;
      var k = this.getKey(key);

      if (self.loading[k]) {
        return self.entries[k].get();
      }

      if (!self.exists(key) || self.isExpired(key)) {
        self.entries[k] = new CacheEntry(self.ttl);
        self.loading[k] = true;

        return self.loader(key).then(function(data) {
          self.entries[k].put(data);

          return self.entries[k].get();
        }, function() {
          delete self.entries[k];

          return $q.reject(new Error('Data can not be cached: ' + k));
        }).finally(function() {
          self.loading[k] = false;
        });
      } else {
        return self.entries[k].get();
      }
    };

    return Cache;

  });
