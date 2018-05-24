'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnUserNotificationDefaultProvider factory', function() {
  var $httpBackend, esnUserNotificationDefaultProvider;

  beforeEach(function() {
    module('esn.user-notification');
  });

  beforeEach(inject(function(
    _esnUserNotificationDefaultProvider_,
    _$httpBackend_
  ) {
    esnUserNotificationDefaultProvider = _esnUserNotificationDefaultProvider_;
    $httpBackend = _$httpBackend_;
  }));

  describe('The list function', function() {
    it('should send a request to /api/user/notifications', function() {
      $httpBackend.expectGET('/api/user/notifications').respond([]);
      esnUserNotificationDefaultProvider.list();
      $httpBackend.flush();
    });

    it('should send a request to /api/user/notifications?limit=10&offset=2&read=false', function() {
      $httpBackend.expectGET('/api/user/notifications?limit=10&offset=2&read=false').respond([]);
      var options = {
        limit: 10,
        offset: 2,
        read: false
      };

      esnUserNotificationDefaultProvider.list(options);
      $httpBackend.flush();
    });

    it('should return a promise', function() {
      expect(esnUserNotificationDefaultProvider.list()).to.be.a.function;
    });
  });

  describe('The setRead function', function() {
    it('should exist', function() {
      expect(esnUserNotificationDefaultProvider).to.respondTo('setRead');
    });

    it('should send a request PUT /api/user/notifications/123456789/read', function() {
      $httpBackend.expectPUT('/api/user/notifications/123456789/read').respond([]);
      esnUserNotificationDefaultProvider.setRead(123456789, true);
      $httpBackend.flush();
    });
  });

  describe('The getUnreadCount function', function() {
    it('should exist', function() {
      expect(esnUserNotificationDefaultProvider).to.respondTo('getUnreadCount');
    });

    it('should send a request GET /api/user/notifications/unread', function() {
      $httpBackend.expectGET('/api/user/notifications/unread').respond([]);
      esnUserNotificationDefaultProvider.getUnreadCount();
      $httpBackend.flush();
    });
  });
});
