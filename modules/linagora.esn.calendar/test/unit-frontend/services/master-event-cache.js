'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('the masterEventCache service', function() {
  var masterEventCache, CalendarShell, fcMoment, timeoutMock, MASTER_EVENT_CACHE_TTL, path, shell, timeoutMockReturn;

  beforeEach(function() {
    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('$timeout', timeoutMock);
    });

    timeoutMockReturn = {};
    timeoutMock = sinon.stub().returns(timeoutMockReturn);
    timeoutMock.cancel = sinon.spy();

    angular.mock.inject(function(_masterEventCache_, _CalendarShell_, _fcMoment_, _MASTER_EVENT_CACHE_TTL_) {
      masterEventCache = _masterEventCache_;
      CalendarShell = _CalendarShell_;
      fcMoment = _fcMoment_;
      MASTER_EVENT_CACHE_TTL = _MASTER_EVENT_CACHE_TTL_;
    });

    path = 'aPath';
    shell = CalendarShell.fromIncompleteShell({
      path: path
    });
  });

  it('should not save an instance', function() {
    masterEventCache.save(CalendarShell.fromIncompleteShell({
      recurrenceId: fcMoment(),
      path: path
    }));
    expect(masterEventCache.get(path)).to.not.exist;
  });

  it('should save a master event', function() {
    masterEventCache.save(shell);
    expect(masterEventCache.get(path)).to.equal(shell);
    expect(masterEventCache.get('randomPath')).to.not.exist;
  });

  it('should unregister previous timeout if replacing a master by an other', function() {
    masterEventCache.save(shell);
    masterEventCache.save(shell);
    expect(timeoutMock.cancel).to.have.been.calledWith(timeoutMockReturn);
  });

  it('should allow deletion of master event element', function() {
    masterEventCache.save(shell);
    masterEventCache.remove(shell);
    expect(timeoutMock.cancel).to.have.been.calledWith(timeoutMockReturn);
    expect(masterEventCache.get(shell.path)).to.be.undefined;
  });

  it('should create a deletion task when saving', function() {
    masterEventCache.save(shell);
    expect(timeoutMock).to.have.been.calledWith(sinon.match(function(deleteFunction) {
      return _.isFunction(deleteFunction) && !(deleteFunction(), masterEventCache.get(path));
    }), MASTER_EVENT_CACHE_TTL);
  });
});
