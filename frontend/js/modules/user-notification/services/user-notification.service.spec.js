'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnUserNotificationService factory', function() {
  beforeEach(function() {
    angular.mock.module('esn.user-notification');
  });

  beforeEach(inject(function(esnUserNotificationService, $httpBackend) {
    this.api = esnUserNotificationService;
    this.$httpBackend = $httpBackend;
  }));

  describe('The list function', function() {
    it('should send a request to /api/user/notifications', function() {
      this.$httpBackend.expectGET('/api/user/notifications').respond([]);
      this.api.list();
      this.$httpBackend.flush();
    });

    it('should send a request to /api/user/notifications?limit=10&offset=2&read=false', function() {
      this.$httpBackend.expectGET('/api/user/notifications?limit=10&offset=2&read=false').respond([]);
      var options = {
        limit: 10,
        offset: 2,
        read: false
      };

      this.api.list(options);
      this.$httpBackend.flush();
    });

    it('should return a promise', function() {
      expect(this.api.list()).to.be.a.function;
    });
  });

  describe('The setRead function', function() {
    it('should exist', function() {
      expect(this.api).to.respondTo('setRead');
    });

    it('should send a request PUT /api/user/notifications/123456789/read', function() {
      this.$httpBackend.expectPUT('/api/user/notifications/123456789/read').respond([]);
      this.api.setRead(123456789, true);
      this.$httpBackend.flush();
    });
  });

  describe('The setAcknowledged function', function() {
    it('should exist', function() {
      expect(this.api).to.respondTo('setAcknowledged');
    });

    it('should send a request PUT /api/user/notifications/123456789/acknowledged', function() {
      this.$httpBackend.expectPUT('/api/user/notifications/123456789/acknowledged').respond([]);
      this.api.setAcknowledged(123456789, true);
      this.$httpBackend.flush();
    });
  });

  describe('The getUnreadCount function', function() {
    it('should exist', function() {
      expect(this.api).to.respondTo('getUnreadCount');
    });

    it('should send a request GET /api/user/notifications/unread', function() {
      this.$httpBackend.expectGET('/api/user/notifications/unread').respond([]);
      this.api.getUnreadCount();
      this.$httpBackend.flush();
    });
  });
});
