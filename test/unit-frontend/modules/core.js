'use strict';
/* global chai: false */
var expect = chai.expect;

describe('The Angular core module', function() {
  beforeEach(angular.mock.module('esn.core'));

  describe('CounterFactory', function() {
    var service, $log, $timeout, userNotificationAPI, $q, unreadDefer, $rootScope;
    var counter, timeoutToTest, callTimes, refreshFn;

    beforeEach(function() {
      callTimes = 0;
      userNotificationAPI = {};
      refreshFn = function() {
        unreadDefer = $q.defer();
        return unreadDefer.promise;
      };

      $log = {
        debug: function() {},
        info: function() {},
        error: function() {}
      };

      $timeout = function(fn, timeout) {
        timeoutToTest = timeout;
        callTimes++;
        setTimeout(fn, 100);
      };

      module(function($provide) {
        $provide.value('$log', $log);
        $provide.value('$timeout', $timeout);
      });
    });

    // Using the global $q instead causes strange test failures that I cannot
    // find a solution to. Remove with caution.
    beforeEach(angular.mock.inject(function($injector, _$q_, _$rootScope_) {
      service = $injector.get('CounterFactory');
      $q = _$q_;
      $rootScope = _$rootScope_;
    }));

    beforeEach(function() {
      timeoutToTest = null;
      callTimes = null;
      counter = service.newCounter(42, 10 * 1000, refreshFn);
    });

    it('should decreaseBy 1 count', function() {
      counter.decreaseBy(1);
      expect(counter.count).to.equals(41);
    });

    it('should increaseBy 1 count', function() {
      counter.increaseBy(1);
      expect(counter.count).to.equals(43);
    });

    it('should allow refreshing the count by calling getUnreadCount after 10 seconds', function() {
      counter.refresh();

      setTimeout(function() {
        unreadDefer.resolve({
          data: {
            unread_count: 420
          }
        });
        $rootScope.$digest();

        expect(counter.count).to.equals(420);
        expect(timeoutToTest).to.equals(10 * 1000);
      }, 200);
    });

    it('should allow set initial count by calling getUnreadCount directly', function() {
      counter.init();

      unreadDefer.resolve({
        data: {
          unread_count: 420
        }
      });
      $rootScope.$digest();

      expect(counter.count).to.equals(420);
    });

    it('should not call getUnreadCount if the timer is already up', function() {
      counter.refresh();
      counter.refresh();
      counter.refresh();
      counter.refresh();

      setTimeout(function() {
        unreadDefer.resolve({
          data: {
            unread_count: 420
          }
        });
        $rootScope.$digest();

        expect(counter.count).to.equals(420);
        expect(callTimes).to.equals(1);
        expect(timeoutToTest).to.equals(10 * 1000);
      }, 200);
    });

  });

  describe('The bytes filter', function() {

    var bytes;
    beforeEach(inject(function($filter) {
      bytes = $filter('bytes');
    }));

    it('should return nothing when there is no filesize', function() {
      expect(bytes('text')).to.equal('-');
    });

    it('should round the filesize based on the configured precision', function() {
      var size = 1024 + 512;
      expect(bytes(size)).to.equal('1.5KB');
      expect(bytes(size, 2)).to.equal('1.50KB');
    });

    it('should recognize bytes', function() {
      expect(bytes(1, 0)).to.equal('1bytes');
    });

    it('should recognize KiloBytes', function() {
      expect(bytes(Math.pow(1024, 1), 0)).to.equal('1KB');
    });

    it('should recognize MegaBytes', function() {
      expect(bytes(Math.pow(1024, 2), 0)).to.equal('1MB');
    });

    it('should recognize GigaBytes', function() {
      expect(bytes(Math.pow(1024, 3), 0)).to.equal('1GB');
    });

    it('should recognize TeraBytes', function() {
      expect(bytes(Math.pow(1024, 4), 0)).to.equal('1TB');
    });

    it('should recognize PetaBytes', function() {
      expect(bytes(Math.pow(1024, 5), 0)).to.equal('1PB');
    });
  });

});
