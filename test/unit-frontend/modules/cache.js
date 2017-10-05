'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.cache Angular module', function() {

  describe('The CacheEntry service', function() {

    beforeEach(function() {
      angular.mock.module('esn.cache');
    });

    beforeEach(inject(function(CacheEntry, CACHE_NO_TTL, $rootScope) {
      this.CacheEntry = CacheEntry;
      this.CACHE_NO_TTL = CACHE_NO_TTL;
      this.$rootScope = $rootScope;
    }));

    describe('The constructor', function() {

      it('should set ttl to default when not defined', function() {
        expect(new this.CacheEntry().ttl).to.equal(this.CACHE_NO_TTL);
      });

      it('should set ttl to given value', function() {
        var ttl = 10;
        expect(new this.CacheEntry(ttl).ttl).to.equal(ttl);
      });

      it('should create a deferred for the entry value', function() {
        expect(new this.CacheEntry().value).to.be.a.function;
      });

    });

    describe('The put function', function() {
      var clock;

      afterEach(function() {
        if (clock) {
          clock.restore();
        }
      });

      it('should set a date', function() {
        var entry = new this.CacheEntry();
        clock = sinon.useFakeTimers();
        expect(entry.now).to.not.be.defined;
        entry.put({});
        clock.tick(10);
        expect(entry.now < Date.now()).to.be.true;
      });

      it('should resolve the promise with the given value', function(done) {
        var value = {foo: 'bar'};
        var entry = new this.CacheEntry();
        entry.get().then(function(data) {
          expect(data).to.deep.equal(value);
          done();
        });
        entry.put(value);
        this.$rootScope.$apply();
      });
    });

    describe('The get function', function() {
      it('should return the value promise', function() {
        var entry = new this.CacheEntry();
        expect(entry.get()).to.be.a.function;
      });
    });

    describe('The isExpired function', function() {

      var clock;

      afterEach(function() {
        if (clock) {
          clock.restore();
        }
      });

      it('should return false when no TTL has been defined', function() {
        var entry = new this.CacheEntry();
        expect(entry.isExpired()).to.be.false;
      });

      it('should return false when data has not been set', function() {
        var entry = new this.CacheEntry(10);
        expect(entry.isExpired()).to.be.false;
      });

      it('should send true if TTL is expired', function() {
        var ttl = 10;
        clock = sinon.useFakeTimers();
        var entry = new this.CacheEntry(ttl);
        clock.tick(10);
        entry.put(1);
        clock.tick(11);
        expect(entry.isExpired()).to.be.true;
      });

      it('should send false if TTL is not expired', function() {
        var ttl = 10;
        clock = sinon.useFakeTimers();
        var entry = new this.CacheEntry(ttl);
        clock.tick(5);
        entry.put(1);
        clock.tick(2);
        expect(entry.isExpired()).to.be.false;
      });
    });
  });

  describe('The Cache service', function() {

    var loader = function() {};

    beforeEach(function() {
      angular.mock.module('esn.cache');
    });

    beforeEach(inject(function(Cache, CACHE_NO_TTL, $rootScope) {
      this.Cache = Cache;
      this.CACHE_NO_TTL = CACHE_NO_TTL;
      this.$rootScope = $rootScope;
    }));

    describe('The constructor', function() {

      it('should throw en error when loader is not defined', function(done) {
        try {
          new this.Cache({});
          done(new Error());
        } catch (e) {
          expect(e.message).to.match(/Data loader is required/);
          done();
        }
      });

      it('should have a default key builder when not defined', function() {
        var cache = new this.Cache({loader: loader});
        expect(cache.getKey).to.be.a.function;
      });

      it('should set the given key builder', function() {
        var builder = function() {};
        var cache = new this.Cache({loader: loader, keyBuilder: builder});
        expect(cache.getKey).to.equal(builder);
      });

      it('should set a default TTL when not defined', function() {
        var cache = new this.Cache({loader: loader});
        expect(cache.ttl).to.equal(this.CACHE_NO_TTL);
      });

      it('should use the given TTL when defined', function() {
        var ttl = 10;
        var cache = new this.Cache({loader: loader, ttl: ttl});
        expect(cache.ttl).to.equal(ttl);
      });
    });

    describe('The exists function', function() {

      it('should return true when entry is defined', function() {
        var key = 'foo';
        var cache = new this.Cache({loader: loader});
        cache.entries[key] = {};
        expect(cache.exists(key)).to.be.true;
      });

      it('should return false when entry is not defined', function() {
        var key = 'foo';
        var cache = new this.Cache({loader: loader});
        expect(cache.exists(key)).to.be.false;
      });
    });

    describe('The isExpired function', function() {

      it('should return false when entry is does not exist', function() {
        var cache = new this.Cache({loader: loader});
        expect(cache.isExpired('1')).to.be.false;
      });

      it('should return false when entry is not expired', function() {
        var key = '1';
        var cache = new this.Cache({loader: loader});
        cache.entries[key] = {
          isExpired: function() {
            return false;
          }
        };
        expect(cache.isExpired(key)).to.be.false;
      });

      it('should return true when entry is expired', function() {
        var key = '1';
        var cache = new this.Cache({loader: loader});
        cache.entries[key] = {
          isExpired: function() {
            return true;
          }
        };
        expect(cache.isExpired(key)).to.be.true;
      });
    });

    describe('The get function', function() {

      var clock;
      afterEach(function() {
        if (clock) {
          clock.restore();
        }
      });

      it('should return the entry value promise when data is loading', function(done) {
        var key = '1';
        var cache = new this.Cache({loader: loader});
        cache.loading[key] = true;
        cache.entries[key] = {
          get: function() {
            done();
          }
        };
        cache.get(key);
        done(new Error('Should not happen'));
      });

      it('should load the data and save it to the cache when data does not exists', function(done) {
        var key = '1';
        var data = {foo: 'bar'};
        var loader = function() {
          return $q.when(data);
        };
        var cache = new this.Cache({loader: loader});
        cache.exist = function() {
          return false;
        };
        cache.isExpired = function() {
          return false;
        };

        cache.get(key).then(function(result) {
          expect(result).to.deep.equal(data);
          expect(cache.loading[key]).to.be.false;
          expect(cache.entries[key].value.promise.$$state.status).to.equal(1);
          done();
        });
        this.$rootScope.$apply();
        done(new Error());
      });

      it('should not store the data if loader fail', function(done) {
        var key = '111';
        var loader = function() {
          return $q.reject(new Error());
        };
        var cache = new this.Cache({loader: loader});

        cache.isExpired = function() {
          return false;
        };

        cache.get(key).then(function() {
          done(new Error('should not happen'));
        }).catch(function(err) {
          expect(err.message).to.equal('Data can not be cached: ' + key);
          expect(cache.exists(key)).to.false;

          done();
        });

        this.$rootScope.$apply();
      });

      it('should load the data and save it to the cache when data exists but expired', function(done) {
        var key = '1';
        var data = {foo: 'bar'};
        var loader = function() {
          return $q.when(data);
        };
        var cache = new this.Cache({loader: loader});
        cache.loading[key] = false;
        cache.exists = function() {
          return true;
        };
        cache.isExpired = function() {
          return true;
        };

        cache.get(key).then(function(result) {
          expect(result).to.deep.equal(data);
          expect(cache.loading[key]).to.be.false;
          expect(cache.entries[key].value.promise.$$state.status).to.equal(1);
          done();
        });
        this.$rootScope.$apply();
        done(new Error());
      });

      it('should return the entry value promise when data exists and is not expired', function(done) {
        var key = '1';
        var loader = sinon.spy();

        var cache = new this.Cache({loader: loader});
        cache.loading[key] = false;
        cache.entries[key] = {get: done};
        cache.exists = function() {
          return true;
        };
        cache.isExpired = function() {
          return false;
        };

        cache.get(key);
        done(new Error());
      });

      it('should load the data from the loader on first time then get it from cache until it expires', function(done) {
        var key = '1';
        var data = {foo: 'bar'};
        var spy = sinon.spy();
        var loader = function(_key) {
          expect(_key).to.equal(key);
          spy();
          return $q.when(data);
        };

        var cache = new this.Cache({loader: loader, ttl: 100000});

        cache.get(key).then(function(result) {
          expect(result).to.deep.equal(data);

          cache.get(key).then(function(result) {
            expect(result).to.deep.equal(data);
            expect(spy).to.have.been.called.once;
            done();
          });
        });
        this.$rootScope.$apply();
        done(new Error());
      });

      it('should load the data from the loader when data expired', function(done) {
        var key = '1';
        var data = {foo: 'bar'};
        var spy = sinon.spy();
        clock = sinon.useFakeTimers();
        var loader = function(_key) {
          expect(_key).to.equal(key);
          spy();
          return $q.when(data);
        };

        var cache = new this.Cache({loader: loader, ttl: 10});

        cache.get(key).then(function(result) {
          expect(result).to.deep.equal(data);

          clock.tick(100);

          cache.get(key).then(function(result) {
            expect(result).to.deep.equal(data);
            expect(spy).to.have.been.called.twice;
            done();
          });
        });
        this.$rootScope.$apply();
        done(new Error());
      });
    });
  });
});
