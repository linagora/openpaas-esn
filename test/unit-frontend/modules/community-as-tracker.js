'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.community-as-tracker Angular module', function() {
  var domainId = '12345';

  beforeEach(function() {
    angular.mock.module('esn.community-as-tracker');
    angular.mock.module(function($provide) {
      $provide.value('session', {
        domain: {
          _id: domainId
        }
      });
      $provide.value('$timeout', function(callback) { callback() });
    });
  });

  describe('communityAStrackerAPI service', function() {
    beforeEach(angular.mock.inject(function(communityAStrackerAPI, $httpBackend, Restangular) {
      this.communityAStrackerAPI = communityAStrackerAPI;
      this.$httpBackend = $httpBackend;
      this.activityStreamUuid = '123456789';
      Restangular.setFullResponse(true);
    }));

    describe('getCommunityActivityStreams() function', function() {
      it('should send a GET to /user/activitystreams?domainid=:id', function() {
        this.$httpBackend.expectGET('/user/activitystreams?domainid=' + domainId).respond(200, []);
        this.communityAStrackerAPI.getCommunityActivityStreams(domainId);
        this.$httpBackend.flush();
      });
    });

    describe('getUnreadCount() function', function() {
      it('should send a GET to /activitystreams/:uuid/unreadcount', function() {
        this.$httpBackend.expectGET('/activitystreams/' + this.activityStreamUuid + '/unreadcount').respond(200, {});
        this.communityAStrackerAPI.getUnreadCount(this.activityStreamUuid);
        this.$httpBackend.flush();
      });
    });
  });

  describe('communityAStrackerHelpers service', function() {
    beforeEach(angular.mock.inject(function(communityAStrackerHelpers, $httpBackend, Restangular) {
      this.communityAStrackerHelpers = communityAStrackerHelpers;
      this.$httpBackend = $httpBackend;
      this.activityStreamUuid1 = '12345678';
      this.activityStreamUuid2 = '123456789';
      Restangular.setFullResponse(true);
    }));

    it('should receive an error if the HTTP status code is not 20X for /user/activitystreams?domainid=:id', function() {
      this.$httpBackend.expectGET('/user/activitystreams?domainid=' + domainId).respond(404, {});
      this.communityAStrackerHelpers.getCommunityActivityStreamsWithUnreadCount(function(err, activityStreamsWithUnreadCount) {
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
      this.communityAStrackerHelpers.getCommunityActivityStreamsWithUnreadCount(function(err, activityStreamsWithUnreadCount) {
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
      this.communityAStrackerHelpers.getCommunityActivityStreamsWithUnreadCount(function(err, activityStreamsWithUnreadCount) {
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

  describe('communityAStrackerController controller', function() {
    beforeEach(angular.mock.inject(function($rootScope, $controller) {
      this.activityStreamUuid1 = '12345678';
      this.activityStreamUuid2 = '123456789';
      this.rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.controller = $controller;
    }));

    it('should initialize $scope.error', function() {
      var communityAStrackerHelpers = {
        getCommunityActivityStreamsWithUnreadCount: function(callback) {
          return callback(new Error('mock'));
        }
      };

      this.controller('communityAStrackerController', {
        $scope: this.scope,
        communityAStrackerHelpers: communityAStrackerHelpers
      });

      expect(this.scope.error).to.exist;
      expect(this.scope.activityStreams).to.not.exist;
    });

    it('should initialize $scope.activityStreams', function() {
      var self = this;
      var communityAStrackerHelpers = {
        getCommunityActivityStreamsWithUnreadCount: function(callback) {
          return callback(null, [
            {
              uuid: self.activityStreamUuid1,
              display_name: 'Community1',
              href: '#',
              img: '',
              unread_count: 2
            },
            {
              uuid: self.activityStreamUuid2,
              display_name: 'Community2',
              href: '#',
              img: '',
              unread_count: 4
            }
          ]);
        }
      };

      var livenotification = function() {
        return {
          on: function() {}
        };
      };

      this.controller('communityAStrackerController', {
        $rootScope: this.rootScope,
        $scope: this.scope,
        communityAStrackerHelpers: communityAStrackerHelpers,
        livenotification: livenotification
      });

      expect(this.scope.activityStreams).to.exist;
      expect(this.scope.activityStreams.length).to.deep.equal(2);
      expect(this.scope.activityStreams[0].uuid).to.deep.equal(this.activityStreamUuid1);
      expect(this.scope.activityStreams[1].uuid).to.deep.equal(this.activityStreamUuid2);
    });

    it('should retrieve the unread count on $rootScope activitystream:updated event', function(done) {
      var self = this;
      var communityAStrackerHelpers = {
        getCommunityActivityStreamsWithUnreadCount: function(callback) {
          return callback(null, [
            {
              uuid: self.activityStreamUuid1,
              display_name: 'Community1',
              href: '#',
              img: '',
              unread_count: 2
            },
            {
              uuid: self.activityStreamUuid2,
              display_name: 'Community2',
              href: '#',
              img: '',
              unread_count: 4
            }
          ]);
        }
      };

      var communityAStrackerAPI = {
        getUnreadCount: function() {
          return done();
        }
      };

      var livenotification = function() {
        return {
          on: function() {}
        };
      };

      this.controller('communityAStrackerController', {
        $rootScope: this.rootScope,
        $scope: this.scope,
        communityAStrackerHelpers: communityAStrackerHelpers,
        livenotification: livenotification,
        communityAStrackerAPI: communityAStrackerAPI
      });

      this.rootScope.$emit('activitystream:updated', {activitystreamUuid: 123});
    });
  });
});
