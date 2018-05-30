'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnUserNotificationState factory', function() {
  var esnUserNotificationCounter, esnUserNotificationSeverity, esnUserNotificationState;

  beforeEach(function() {
    module('esn.user-notification');

    inject(function(
      _esnUserNotificationCounter_,
      _esnUserNotificationSeverity_,
      _esnUserNotificationState_
    ) {
      esnUserNotificationCounter = _esnUserNotificationCounter_;
      esnUserNotificationSeverity = _esnUserNotificationSeverity_;
      esnUserNotificationState = _esnUserNotificationState_;
    });
  });

  describe('The getCount function', function() {
    it('should return esnUserNotificationCounter.count', function() {
      var count = 10;

      esnUserNotificationCounter.count = count;

      expect(esnUserNotificationState.getCount()).to.equal(count);
    });
  });

  describe('The getNumberOfImportantNotifications function', function() {
    it('should return esnUserNotificationSeverity.count', function() {
      var count = 10;

      esnUserNotificationSeverity.count = count;

      expect(esnUserNotificationState.getNumberOfImportantNotifications()).to.equal(count);
    });
  });

  describe('The decreaseCountBy function', function() {
    it('should call esnUserNotificationCounter.decreaseBy function', function() {
      var number = 10;

      esnUserNotificationCounter.decreaseBy = sinon.spy();
      esnUserNotificationState.decreaseCountBy(number);

      expect(esnUserNotificationCounter.decreaseBy).to.have.been.calledOnce;
      expect(esnUserNotificationCounter.decreaseBy).to.have.been.calledWith(number);
    });
  });

  describe('The decreaseNumberOfImportantNotificationsBy function', function() {
    it('should call esnUserNotificationSeverity.decreaseBy function', function() {
      var number = 10;

      esnUserNotificationSeverity.decreaseBy = sinon.spy();
      esnUserNotificationState.decreaseNumberOfImportantNotificationsBy(number);

      expect(esnUserNotificationSeverity.decreaseBy).to.have.been.calledOnce;
      expect(esnUserNotificationSeverity.decreaseBy).to.have.been.calledWith(number);
    });
  });

  describe('The increaseCountBy function', function() {
    it('should call esnUserNotificationCounter.increaseBy function', function() {
      var number = 10;

      esnUserNotificationCounter.increaseBy = sinon.spy();
      esnUserNotificationState.increaseCountBy(number);

      expect(esnUserNotificationCounter.increaseBy).to.have.been.calledOnce;
      expect(esnUserNotificationCounter.increaseBy).to.have.been.calledWith(number);
    });
  });

  describe('The increaseNumberOfImportantNotificationsBy function', function() {
    it('should call esnUserNotificationSeverity.increaseBy function', function() {
      var number = 10;

      esnUserNotificationSeverity.increaseBy = sinon.spy();
      esnUserNotificationState.increaseNumberOfImportantNotificationsBy(number);

      expect(esnUserNotificationSeverity.increaseBy).to.have.been.calledOnce;
      expect(esnUserNotificationSeverity.increaseBy).to.have.been.calledWith(number);
    });
  });

  describe('The init function', function() {
    it('should call esnUserNotificationSeverity.init and esnUserNotificationCounter.init functions', function() {
      esnUserNotificationSeverity.init = sinon.spy();
      esnUserNotificationCounter.init = sinon.spy();
      esnUserNotificationState.init();

      expect(esnUserNotificationSeverity.init).to.have.been.calledOnce;
      expect(esnUserNotificationCounter.init).to.have.been.calledOnce;
    });
  });

  describe('The refresh function', function() {
    it('should call esnUserNotificationSeverity.refresh and esnUserNotificationCounter.refresh functions', function() {
      esnUserNotificationSeverity.refresh = sinon.spy();
      esnUserNotificationCounter.refresh = sinon.spy();
      esnUserNotificationState.refresh();

      expect(esnUserNotificationSeverity.refresh).to.have.been.calledOnce;
      expect(esnUserNotificationCounter.refresh).to.have.been.calledOnce;
    });
  });
});
