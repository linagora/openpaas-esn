'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.activitystreams-tracker Angular module', function() {
  var domainId = '12345';

  beforeEach(function() {
    angular.mock.module('esn.activitystreams-tracker');
    angular.mock.module(function($provide) {
      $provide.value('session', {
        domain: {
          _id: domainId
        }
      });
      $provide.value('$timeout', function(callback) { callback(); });
    });
  });

  describe('ASTrackerAPI service', function() {
    beforeEach(angular.mock.inject(function(ASTrackerAPI, $httpBackend, Restangular) {
      this.ASTrackerAPI = ASTrackerAPI;
      this.$httpBackend = $httpBackend;
      this.activityStreamUuid = '123456789';
      Restangular.setFullResponse(true);
    }));

    describe('getActivityStreams() function', function() {
      it('should send a GET to /user/activitystreams?domainid=:id', function() {
        this.$httpBackend.expectGET('/user/activitystreams?domainid=' + domainId).respond(200, []);
        this.ASTrackerAPI.getActivityStreams(domainId);
        this.$httpBackend.flush();
      });
    });

    describe('getUnreadCount() function', function() {
      it('should send a GET to /activitystreams/:uuid/unreadcount', function() {
        this.$httpBackend.expectGET('/activitystreams/' + this.activityStreamUuid + '/unreadcount').respond(200, {});
        this.ASTrackerAPI.getUnreadCount(this.activityStreamUuid);
        this.$httpBackend.flush();
      });
    });
  });

  describe('AStrackerHelpers service', function() {
    beforeEach(angular.mock.inject(function(AStrackerHelpers, $httpBackend, Restangular) {
      this.AStrackerHelpers = AStrackerHelpers;
      this.$httpBackend = $httpBackend;
      this.activityStreamUuid1 = '12345678';
      this.activityStreamUuid2 = '123456789';
      Restangular.setFullResponse(true);
    }));

    it('should receive an error if the HTTP status code is not 20X for /user/activitystreams?domainid=:id', function() {
      this.$httpBackend.expectGET('/user/activitystreams?domainid=' + domainId).respond(404, {});
      this.AStrackerHelpers.getActivityStreamsWithUnreadCount('community', function(err, activityStreamsWithUnreadCount) {
        expect(err).to.exist;
        expect(activityStreamsWithUnreadCount).to.not.exist;
      });
      this.$httpBackend.flush();
    });

    it('should receive an error if the HTTP status code is not 20X for /activitystreams/:uuid/unreadcount', function() {
      this.$httpBackend.expectGET('/user/activitystreams?domainid=' + domainId).respond(200, [
        {
          uuid: this.activityStreamUuid1,
          target: {
            displayName: 'Community',
            objectType: 'community',
            _id: '123'
          }
        },
        {
          uuid: this.activityStreamUuid2,
          target: {
            displayName: 'Community',
            objectType: 'community',
            _id: '123'
          }
        }
      ]);
      this.$httpBackend.expectGET('/activitystreams/' + this.activityStreamUuid1 + '/unreadcount').respond(200, {
        _id: this.activityStreamUuid1,
        unread_count: 2
      });
      this.$httpBackend.expectGET('/activitystreams/' + this.activityStreamUuid2 + '/unreadcount').respond(404, {});
      this.AStrackerHelpers.getActivityStreamsWithUnreadCount('community', function(err, activityStreamsWithUnreadCount) {
        expect(err).to.exist;
        expect(activityStreamsWithUnreadCount).to.not.exist;
      });
      this.$httpBackend.flush();
    });

    it('should send a GET to /user/activitystreams?domainid=:id and 2 GET to /activitystreams/:uuid/unreadcount', function() {
      this.$httpBackend.expectGET('/user/activitystreams?domainid=' + domainId).respond(200, [
        {
          uuid: this.activityStreamUuid1,
          target: {
            displayName: 'Community',
            objectType: 'community',
            _id: '123'
          }
        },
        {
          uuid: this.activityStreamUuid2,
          target: {
            displayName: 'Community',
            objectType: 'community',
            _id: '123'
          }
        }
      ]);
      this.$httpBackend.expectGET('/activitystreams/' + this.activityStreamUuid1 + '/unreadcount').respond(200, {
        _id: this.activityStreamUuid1,
        unread_count: 2
      });
      this.$httpBackend.expectGET('/activitystreams/' + this.activityStreamUuid2 + '/unreadcount').respond(200, {
        _id: this.activityStreamUuid2,
        unread_count: 4
      });
      var self = this;
      this.AStrackerHelpers.getActivityStreamsWithUnreadCount('community', function(err, activityStreamsWithUnreadCount) {
        expect(err).to.not.exist;
        expect(activityStreamsWithUnreadCount).to.exist;
        expect(activityStreamsWithUnreadCount.length).to.deep.equal(2);
        expect(activityStreamsWithUnreadCount[0].uuid).to.deep.equal(self.activityStreamUuid1);
        expect(activityStreamsWithUnreadCount[0].unread_count).to.deep.equal(2);
        expect(activityStreamsWithUnreadCount[1].uuid).to.deep.equal(self.activityStreamUuid2);
        expect(activityStreamsWithUnreadCount[1].unread_count).to.deep.equal(4);
      });
      this.$httpBackend.flush();
    });
  });

  describe('ASTrackerController controller', function() {

    beforeEach(angular.mock.inject(function($controller, $rootScope) {
      this.controller = $controller;
      this.$rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.timeout = function(callback) {
        return callback();
      };
    }));

    it('should retrieve the unread count on $rootScope activitystream:updated event', function(done) {

      var ASTrackerAPI = {
        getUnreadCount: function() {
          return done();
        }
      };

      var ASTrackerNotificationService = {};

      this.controller('ASTrackerController', {
        $rootScope: this.$rootScope,
        $scope: this.scope,
        ASTrackerNotificationService: ASTrackerNotificationService,
        ASTrackerAPI: ASTrackerAPI,
        $timeout: this.timeout
      });

      this.$rootScope.$emit('activitystream:updated', {activitystreamUuid: 123});
    });
  });
});
