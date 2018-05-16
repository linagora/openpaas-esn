'use strict';

/* global chai: false; sinon: false */

var expect = chai.expect;

describe('The esnAppStateService service', function() {
  var $window, $rootScope, esnAppStateService;
  var ESN_APP_STATE_CHANGE_EVENT;

  beforeEach(module('esn.app-state'));

  beforeEach(inject(function(
    _$window_,
    _$rootScope_,
    _esnAppStateService_,
    _ESN_APP_STATE_CHANGE_EVENT_
  ) {
    $window = _$window_;
    $rootScope = _$rootScope_;
    esnAppStateService = _esnAppStateService_;
    ESN_APP_STATE_CHANGE_EVENT = _ESN_APP_STATE_CHANGE_EVENT_;
  }));

  describe('The isForeground function', function() {
    it('should returns true by default if the foreground state never changed', function() {
      expect(esnAppStateService.isForeground()).to.be.true;
    });
  });

  describe('The listenStateEvents function', function() {
    beforeEach(function() {
      $rootScope.$broadcast = sinon.spy();
    });

    describe('The $window focus listener', function() {
      it('should set the foreground state to true and broadcast a state changed event', function() {
        esnAppStateService.listenStateEvents();
        $window.dispatchEvent(new Event('focus'));

        expect(esnAppStateService.isForeground()).to.be.true;
        expect($rootScope.$broadcast).to.have.been.calledWith(ESN_APP_STATE_CHANGE_EVENT, true);
      });
    });

    describe('The $window blur listener', function() {
      it('should set the foreground state to false and broadcast a state changed event', function() {
        esnAppStateService.listenStateEvents();
        $window.dispatchEvent(new Event('blur'));

        expect(esnAppStateService.isForeground()).to.be.false;
        expect($rootScope.$broadcast).to.have.been.calledWith(ESN_APP_STATE_CHANGE_EVENT, false);
      });
    });
  });
});
