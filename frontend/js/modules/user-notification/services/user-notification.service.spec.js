'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnUserNotificationService factory', function() {
  var esnUserNotificationService, esnUserNotificationState, esnUserNotificationProviders;

  beforeEach(function() {
    angular.module('esn.user-notification.test', ['esn.user-notification'])
      .run(function(esnUserNotificationProviders) {
        esnUserNotificationProviders.add({
          name: 'testNotificationProvider',
          list: function() {
            return 'foobar';
          }
        });
      });

    module('esn.user-notification', 'esn.user-notification.test');
  });

  beforeEach(inject(function(
    _esnUserNotificationService_,
    _esnUserNotificationState_,
    _esnUserNotificationProviders_
  ) {
    esnUserNotificationProviders = _esnUserNotificationProviders_;
    esnUserNotificationService = _esnUserNotificationService_;
    esnUserNotificationState = _esnUserNotificationState_;
  }));

  describe('The addProvider function', function() {
    it('should call esnUserNotificationProviders.add and init notification counter service', function() {
      var provider = {
        name: 'testNotificationProvider',
        list: angular.noop,
        getUnreadCount: angular.noop
      };

      esnUserNotificationProviders.add = sinon.spy();
      esnUserNotificationState.init = sinon.spy();

      esnUserNotificationService.addProvider(provider);

      expect(esnUserNotificationProviders.add).to.have.been.calledWith(provider);
      expect(esnUserNotificationState.init).to.have.been.called;
    });
  });

  describe('The getListFunctions function', function() {
    it('should return an arrays of list functions from registered providers', function() {
      var listFunctions = esnUserNotificationService.getListFunctions();

      expect(listFunctions).to.have.length(1);
      expect(listFunctions[0]()).to.equal('foobar');
    });
  });
});
