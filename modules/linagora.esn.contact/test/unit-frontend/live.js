'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Contact Live module', function() {

  beforeEach(function() {
    module('esn.core');
    module('esn.websocket');
    module('esn.api-notification');
    module('linagora.esn.contact');
  });

  describe('The ContactLiveUpdate service', function() {
    var liveNotificationMock, onFn, removeListenerFn;
    var $rootScope, ContactLiveUpdate, CONTACT_SIO_EVENTS;
    var namespace = '/contacts';
    var session = {};

    beforeEach(function() {
      session = {};
      onFn = sinon.spy();
      removeListenerFn = sinon.spy();
      liveNotificationMock = sinon.stub().returns({
        on: onFn,
        removeListener: removeListenerFn
      });

      module(function($provide) {
        $provide.value('livenotification', liveNotificationMock);
        $provide.value('session', session);
      });

      inject(function(_$rootScope_, _ContactLiveUpdate_, _CONTACT_SIO_EVENTS_) {
        $rootScope = _$rootScope_;
        ContactLiveUpdate = _ContactLiveUpdate_;
        CONTACT_SIO_EVENTS = _CONTACT_SIO_EVENTS_;
      });

    });

    describe('The startListen fn', function() {

      it('should be called when user switches to contact module', function() {
        session.user = {_id: 1};
        $rootScope.$broadcast('$stateChangeSuccess', {
          name: '/contact'
        });
        expect(onFn.callCount).to.equal(3);
      });

      it('should subscribe /contacts namespace with bookId', function() {
        var bookId = 'some book id';
        ContactLiveUpdate.startListen(bookId);
        expect(liveNotificationMock.calledOnce).to.be.true;
        expect(liveNotificationMock.calledWithExactly(namespace, bookId)).to.be.true;
      });

      it('should make sio to listen on CONTACT_SIO_EVENTS.CREATED event', function() {
        var bookId = 'some book id';
        ContactLiveUpdate.startListen(bookId);
        expect(onFn.firstCall.calledWith(CONTACT_SIO_EVENTS.CREATED)).to.be.true;
      });

      it('should make sio to listen on CONTACT_SIO_EVENTS.DELETED event', function() {
        var bookId = 'some book id';
        ContactLiveUpdate.startListen(bookId);
        expect(onFn.secondCall.calledWith(CONTACT_SIO_EVENTS.DELETED)).to.be.true;
      });

      it('should make sio to listen on CONTACT_SIO_EVENTS.UPDATED event', function() {
        var bookId = 'some book id';
        ContactLiveUpdate.startListen(bookId);
        expect(onFn.thirdCall.calledWith(CONTACT_SIO_EVENTS.UPDATED)).to.be.true;
      });

    });

    describe('The stopListen fn', function() {

      it('should be call when user switches to outside contact module', function() {
        var bookId = 'some book id';
        ContactLiveUpdate.startListen(bookId);

        $rootScope.$broadcast('$stateChangeSuccess', {
          name: '/other/module/path'
        });

        expect(removeListenerFn.callCount).to.equal(3);
      });

      it('should make sio to remove CONTACT_SIO_EVENTS.CREATED event listener', function() {
        var bookId = 'some book id';
        ContactLiveUpdate.startListen(bookId);

        ContactLiveUpdate.stopListen();
        expect(removeListenerFn.firstCall.calledWith(CONTACT_SIO_EVENTS.CREATED)).to.be.true;
      });

      it('should make sio to remove CONTACT_SIO_EVENTS.DELETED event listener', function() {
        var bookId = 'some book id';
        ContactLiveUpdate.startListen(bookId);

        ContactLiveUpdate.stopListen();
        expect(removeListenerFn.secondCall.calledWith(CONTACT_SIO_EVENTS.DELETED)).to.be.true;
      });

      it('should make sio to remove CONTACT_SIO_EVENTS.UPDATED event listener', function() {
        var bookId = 'some book id';
        ContactLiveUpdate.startListen(bookId);

        ContactLiveUpdate.stopListen();
        expect(removeListenerFn.thirdCall.calledWith(CONTACT_SIO_EVENTS.UPDATED)).to.be.true;
      });
    });
  });
});
