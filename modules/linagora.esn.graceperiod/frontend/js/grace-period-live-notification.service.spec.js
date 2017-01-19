'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The gracePeriodLiveNotificationService service', function() {

  beforeEach(function() {
    module('esn.websocket');
    module('esn.http');
    module('linagora.esn.graceperiod');
  });

  describe('Functions tests', function() {

    var gracePeriodLiveNotificationService;
    var liveNotificationMock, onFn, removeListenerFn;

    beforeEach(function() {
      onFn = sinon.spy();
      removeListenerFn = sinon.spy();
      liveNotificationMock = sinon.stub().returns({
        on: onFn,
        removeListener: removeListenerFn
      });

      module(function($provide) {
        $provide.value('livenotification', liveNotificationMock);
      });

      inject(function(_gracePeriodLiveNotificationService_) {
        gracePeriodLiveNotificationService = _gracePeriodLiveNotificationService_;
      });
    });

    describe('The start function', function() {
      it('should register listener once', function() {
        gracePeriodLiveNotificationService.start();
        gracePeriodLiveNotificationService.start();
        expect(onFn.callCount).to.equal(2);
      });

      it('should register listeners for error and done events', function() {
        gracePeriodLiveNotificationService.start();
        expect(onFn.firstCall.calledWith('graceperiod:error')).to.be.true;
        expect(onFn.secondCall.calledWith('graceperiod:done')).to.be.true;
      });
    });

    describe('The registerListeners function', function() {
      it('should fail when not given a id', function() {
        expect(function() {
          gracePeriodLiveNotificationService.registerListeners();
        }).to.throw(Error);
        expect(gracePeriodLiveNotificationService.getListeners()).to.be.empty;
      });

      it('should save listeners', function() {
        gracePeriodLiveNotificationService.registerListeners('foo');
        expect(gracePeriodLiveNotificationService.getListeners().foo).to.exist;
      });

      it('should save listeners as many times as called', function() {
        gracePeriodLiveNotificationService.registerListeners('foo');
        gracePeriodLiveNotificationService.registerListeners('foo');
        gracePeriodLiveNotificationService.registerListeners('bar');
        expect(gracePeriodLiveNotificationService.getListeners().foo.length).to.equal(2);
        expect(gracePeriodLiveNotificationService.getListeners().bar.length).to.equal(1);
      });

    });

    describe('The unregisterListeners function', function() {
      it('should fail when task is null', function() {
        gracePeriodLiveNotificationService.registerListeners('foo');
        expect(gracePeriodLiveNotificationService.unregisterListeners).to.throw(Error);
        expect(gracePeriodLiveNotificationService.getListeners().foo.length).to.equal(1);
      });

      it('should remove listeners for given task', function() {
        gracePeriodLiveNotificationService.registerListeners('foo');
        gracePeriodLiveNotificationService.unregisterListeners('foo');
        expect(gracePeriodLiveNotificationService.getListeners().foo).to.not.exist;
      });
    });
  });

  describe('Events tests', function() {

    var gracePeriodLiveNotificationService, $rootScope;
    var liveNotificationMock;

    beforeEach(function() {
      var events = {};

      var handler = function(event, data) {
        if (!events[event]) {
          return;
        }

        events[event].forEach(function(listener) {
          listener(data);
        });

      };

      liveNotificationMock = function() {
        return {
          emit: handler,
          on: function(event, callback) {
            if (!events[event]) {
              events[event] = [];
            }
            events[event].push(callback);
          }
        };
      };

      module(function($provide) {
        $provide.value('livenotification', liveNotificationMock);
      });

      inject(function(_$rootScope_, _gracePeriodLiveNotificationService_) {
        $rootScope = _$rootScope_;
        gracePeriodLiveNotificationService = _gracePeriodLiveNotificationService_;
      });
    });

    describe('When started', function() {

      describe('on error event', function() {
        it('should make corresponding promise fail', function() {

          var sio = gracePeriodLiveNotificationService.start();

          var id = 'foo';
          var spyThatShouldBeCalled = sinon.spy();
          var spyThatShouldNotBeCalled = sinon.spy();

          gracePeriodLiveNotificationService.registerListeners(id).then(spyThatShouldNotBeCalled, spyThatShouldBeCalled);
          gracePeriodLiveNotificationService.registerListeners(id).then(spyThatShouldNotBeCalled);
          gracePeriodLiveNotificationService.registerListeners('bar', spyThatShouldNotBeCalled);

          $rootScope.$digest();
          sio.emit('graceperiod:error', {id: id});
          $rootScope.$digest();

          expect(spyThatShouldBeCalled).to.have.been.called;
          expect(spyThatShouldNotBeCalled).to.have.not.been.called;
        });

        it('should make corresponding promise fail only once', function() {
          var sio = gracePeriodLiveNotificationService.start();
          var id = 'foo';

          var errorSpy1 = sinon.spy();
          var errorSpy2 = sinon.spy();

          gracePeriodLiveNotificationService.registerListeners(id).catch(errorSpy1);
          gracePeriodLiveNotificationService.registerListeners(id).catch(errorSpy2);

          $rootScope.$digest();
          sio.emit('graceperiod:error', {id: id});
          $rootScope.$digest();
          sio.emit('graceperiod:error', {id: id});
          $rootScope.$digest();
          expect(errorSpy1).to.have.been.calledOnce;
          expect(errorSpy2).to.have.been.calledOnce;
        });

      });

      describe('on done event', function() {
        it('should run all the registered done listeners', function() {
          var sio = gracePeriodLiveNotificationService.start();
          var id = 'foo';
          var spyThatShouldBeCalled = sinon.spy();
          var spyThatShouldNotBeCalled = sinon.spy();

          gracePeriodLiveNotificationService.registerListeners(id).then(spyThatShouldBeCalled, spyThatShouldNotBeCalled);
          gracePeriodLiveNotificationService.registerListeners(id).catch(spyThatShouldNotBeCalled);
          gracePeriodLiveNotificationService.registerListeners('bar').catch(spyThatShouldNotBeCalled, spyThatShouldNotBeCalled);

          $rootScope.$digest();
          sio.emit('graceperiod:done', {id: id});
          $rootScope.$digest();

          expect(spyThatShouldBeCalled).to.have.been.called;
          expect(spyThatShouldNotBeCalled).to.have.not.been.called;
        });

        it('should run all the registered done listeners once', function() {
          var sio = gracePeriodLiveNotificationService.start();

          var id = 'foo';
          var spy1 = sinon.spy();
          var spy2 = sinon.spy();

          gracePeriodLiveNotificationService.registerListeners(id).then(spy1);
          gracePeriodLiveNotificationService.registerListeners(id).then(spy2);

          $rootScope.$digest();
          sio.emit('graceperiod:done', {id: id});
          $rootScope.$digest();
          sio.emit('graceperiod:done', {id: id});
          $rootScope.$digest();
          expect(spy1).to.have.been.calledOnce;
          expect(spy2).to.have.been.calledOnce;
        });
      });
    });
  });
});
