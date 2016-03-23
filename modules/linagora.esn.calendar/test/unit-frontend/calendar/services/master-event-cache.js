'use strict';

/* global chai: false */

var expect = chai.expect;

describe('the masterEventCache service', function() {
  var masterEventCache, CalendarShell, fcMoment, timeoutMock, MASTER_EVENT_CACHE_TTL;

  beforeEach(function() {
    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('$timeout', function(delayedFunction, time) {
        if (timeoutMock) {
          timeoutMock(delayedFunction, time);
        }
      });
    });

    angular.mock.inject(function(_masterEventCache_, _CalendarShell_, _fcMoment_, _MASTER_EVENT_CACHE_TTL_) {
      masterEventCache = _masterEventCache_;
      CalendarShell = _CalendarShell_;
      fcMoment = _fcMoment_;
      MASTER_EVENT_CACHE_TTL = _MASTER_EVENT_CACHE_TTL_;
    });
  });

  afterEach(function() {
    timeoutMock = null;
  });

  it('should not save an instance', function() {
    var path = 'aPath';
    masterEventCache.save(CalendarShell.fromIncompleteShell({
      recurrenceId: fcMoment(),
      path: path
    }));
    expect(masterEventCache.get(path)).to.not.exist;
  });

  it('should save a master event', function() {
    var path = 'aPath';
    var shell = CalendarShell.fromIncompleteShell({
      path: path
    });
    masterEventCache.save(shell);
    expect(masterEventCache.get(path)).to.equal(shell);
    expect(masterEventCache.get('randomPath')).to.not.exist;
  });

  it('should create a deletion task when saving', function() {
    var path = 'aPath';
    var shell = CalendarShell.fromIncompleteShell({
      path: path
    });

    timeoutMock = function(deleteFunction, ttl) {
      expect(deleteFunction).to.be.a.function;
      expect(ttl).to.equal(MASTER_EVENT_CACHE_TTL);
      deleteFunction();
      expect(masterEventCache.get(path)).to.not.exist;
    };

    masterEventCache.save(shell);
  });
});
