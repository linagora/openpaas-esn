'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esnUserNotificationWebsocketListenerService factory', function() {
  var liveNotification, scope, esnUserNotificationCounter, esnUserNotificationWebsocketListenerService, ESN_USER_NOTIFICATION_WEBSOCKET;

  beforeEach(function() {
    var liveNotificationMock = function(namespace) {
      if (liveNotification) {
        return liveNotification(namespace);
      }

      return {
        on: function() {},
        removeListener: function() {}
      };
    };

    angular.mock.module('esn.user-notification');
    angular.mock.module(function($provide) {
      $provide.value('livenotification', liveNotificationMock);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _esnUserNotificationWebsocketListenerService_, _esnUserNotificationCounter_, _ESN_USER_NOTIFICATION_WEBSOCKET_) {
    scope = _$rootScope_.$new();
    esnUserNotificationWebsocketListenerService = _esnUserNotificationWebsocketListenerService_;
    ESN_USER_NOTIFICATION_WEBSOCKET = _ESN_USER_NOTIFICATION_WEBSOCKET_;
    esnUserNotificationCounter = _esnUserNotificationCounter_;
  }));

  afterEach(function() {
    liveNotification = null;
  });

  describe('The listenEvents function', function() {
    var listener, esnUserNotificationCounterSpies, wsUserNotificationCreatedListener, wsUserNotificationUpdatedListener;

    beforeEach(function() {
      liveNotification = function(namespace) {
        expect(namespace).to.equal(ESN_USER_NOTIFICATION_WEBSOCKET.NAMESPACE);

        return {
          on: function(event, handler) {
            switch (event) {
              case ESN_USER_NOTIFICATION_WEBSOCKET.NOTIFICATION.CREATED:
                wsUserNotificationCreatedListener = handler;
                break;
              case ESN_USER_NOTIFICATION_WEBSOCKET.NOTIFICATION.UPDATED:
                wsUserNotificationUpdatedListener = handler;
                break;
            }
          }
        };
      };

      listener = esnUserNotificationWebsocketListenerService.listenEvents();
    });

    beforeEach(function() {
      esnUserNotificationCounterSpies = {
        increaseBy: sinon.spy(esnUserNotificationCounter, 'increaseBy'),
        decreaseBy: sinon.spy(esnUserNotificationCounter, 'decreaseBy'),
        refresh: sinon.spy(esnUserNotificationCounter, 'refresh')
      };
    });

    afterEach(function() {
      esnUserNotificationCounterSpies.increaseBy.restore();
      esnUserNotificationCounterSpies.decreaseBy.restore();
      esnUserNotificationCounterSpies.refresh.restore();
    });

    it('should return a valid hash', function() {
      expect(listener.sio).to.exist;
    });

    describe('on NOTIFICATION.CREATED event', function() {
      it('should increase counter by 1', function() {
        wsUserNotificationCreatedListener({acknowledged: false});
        scope.$digest();

        expect(esnUserNotificationCounter.increaseBy).to.have.been.calledWith(1);
      });

      it('should call refresh once', function() {
        wsUserNotificationCreatedListener({acknowledged: false});
        scope.$digest();

        expect(esnUserNotificationCounter.increaseBy).to.have.been.calledOnce;
      });
    });

    describe('on NOTIFICATION.UPDATED event', function() {
      it('should decrease counter by 1 if notification is already acknowledged', function() {
        wsUserNotificationUpdatedListener({acknowledged: true});
        scope.$digest();

        expect(esnUserNotificationCounter.decreaseBy).to.have.been.calledWith(1);
      });

      it('should NOT decrease counter by 1 if notification is not acknowledged', function() {
        wsUserNotificationUpdatedListener({acknowledged: false});
        scope.$digest();

        expect(esnUserNotificationCounter.decreaseBy).to.not.have.been.called;
      });

      it('should call refresh once if notification is acknowledged', function() {
        wsUserNotificationUpdatedListener({acknowledged: true});
        scope.$digest();

        expect(esnUserNotificationCounter.refresh).to.have.been.calledOnce;
      });

      it('should call refresh once if notification is not acknowledged', function() {
        wsUserNotificationUpdatedListener({acknowledged: false});
        scope.$digest();

        expect(esnUserNotificationCounter.refresh).to.have.been.calledOnce;
      });
    });
  });
});
