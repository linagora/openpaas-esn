'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('the calMasterEventCache service', function() {
  var calMasterEventCache, CalendarShell, calMoment, timeoutMock, CAL_MASTER_EVENT_CACHE_TTL, path, shell, timeoutMockReturn;

  beforeEach(function() {
    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.value('$timeout', timeoutMock);
    });

    timeoutMockReturn = {};
    timeoutMock = sinon.stub().returns(timeoutMockReturn);
    timeoutMock.cancel = sinon.spy();

    angular.mock.inject(function(_calMasterEventCache_, _CalendarShell_, _calMoment_, _CAL_MASTER_EVENT_CACHE_TTL_) {
      calMasterEventCache = _calMasterEventCache_;
      CalendarShell = _CalendarShell_;
      calMoment = _calMoment_;
      CAL_MASTER_EVENT_CACHE_TTL = _CAL_MASTER_EVENT_CACHE_TTL_;
    });

    path = 'aPath';
    shell = CalendarShell.fromIncompleteShell({
      path: path
    });
  });

  it('should not save an instance', function() {
    calMasterEventCache.save(CalendarShell.fromIncompleteShell({
      recurrenceId: calMoment(),
      path: path
    }));
    expect(calMasterEventCache.get(path)).to.not.exist;
  });

  it('should save a master event', function() {
    calMasterEventCache.save(shell);
    expect(calMasterEventCache.get(path)).to.equal(shell);
    expect(calMasterEventCache.get('randomPath')).to.not.exist;
  });

  it('should unregister previous timeout if replacing a master by an other', function() {
    calMasterEventCache.save(shell);
    calMasterEventCache.save(shell);
    expect(timeoutMock.cancel).to.have.been.calledWith(timeoutMockReturn);
  });

  it('should allow deletion of master event element', function() {
    calMasterEventCache.save(shell);
    calMasterEventCache.remove(shell);
    expect(timeoutMock.cancel).to.have.been.calledWith(timeoutMockReturn);
    expect(calMasterEventCache.get(shell.path)).to.be.undefined;
  });

  it('should create a deletion task when saving', function() {
    calMasterEventCache.save(shell);
    expect(timeoutMock).to.have.been.calledWith(sinon.match(function(deleteFunction) {
      return _.isFunction(deleteFunction) && !(deleteFunction(), calMasterEventCache.get(path));
    }), CAL_MASTER_EVENT_CACHE_TTL);
  });
});
