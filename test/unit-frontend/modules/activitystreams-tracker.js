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
      it('should send a GET to /user/activitystreams?domainid=:id&member=true', function() {
        this.$httpBackend.expectGET('/user/activitystreams?domainid=' + domainId + '&member=true').respond(200, []);
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

    describe('getActivityStreamsWithUnreadCount function', function() {

      it('should receive an error if the HTTP call to /user/activitystreams?domainid=:id&member=true fails', function() {
        this.$httpBackend.expectGET('/user/activitystreams?domainid=' + domainId + '&member=true').respond(404, {});
        this.AStrackerHelpers.getActivityStreamsWithUnreadCount('community', function(err, activityStreamsWithUnreadCount) {
          expect(err).to.exist;
          expect(activityStreamsWithUnreadCount).to.not.exist;
        });
        this.$httpBackend.flush();
      });

      it('should receive an error if the HTTP status code is not 20X for /activitystreams/:uuid/unreadcount', function() {
        this.$httpBackend.expectGET('/user/activitystreams?domainid=' + domainId + '&member=true').respond(200, [
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

      it('should send a GET to /user/activitystreams?domainid=:id&member=true and 2 GET to /activitystreams/:uuid/unreadcount', function() {
        this.$httpBackend.expectGET('/user/activitystreams?domainid=' + domainId + '&member=true').respond(200, [
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

    it('should call ASTrackerNotificationService.removeAllListeners() on destroy', function(done) {
      var ASTrackerNotificationService = {
        removeAllListeners: done
      };

      this.controller('ASTrackerController', {
        $rootScope: this.$rootScope,
        $scope: this.scope,
        ASTrackerNotificationService: ASTrackerNotificationService,
        ASTrackerAPI: {},
        $timeout: this.timeout
      });

      this.scope.$emit('$destroy');
    });

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

    describe('on collaboration:join event', function() {

      beforeEach(function() {
        var self = this;
        this.roomJoinCalled = false;
        this.rootScopeMock = {
          $on: function(eventName, eventCallback) {
            if (eventName === 'collaboration:join') {
              self.$rootScope.$on(eventName, eventCallback);
              self.roomJoinCalled = true;
            }
          }
        };

        this.checkRoomJoinCalled = function(done) {
          setInterval(function() {
            if (self.roomJoinCalled) {
              clearInterval();
              done();
            }
          }, 25);
        };
      });

      it('should do nothing if the event has no attached data', function(done) {
        var ASTrackerSubscriptionService = {
          get: function() {
            done('should not have been called');
          }
        };

        this.controller('ASTrackerController', {
          $rootScope: this.rootScopeMock,
          $scope: this.scope,
          ASTrackerSubscriptionService: ASTrackerSubscriptionService
        });

        this.scope.$emit('collaboration:join');
        this.checkRoomJoinCalled(done);
      });

      it('should do nothing if the event data does not contain a collaboration', function(done) {
        var ASTrackerSubscriptionService = {
          get: function() {
            done('should not have been called');
          }
        };

        this.controller('ASTrackerController', {
          $rootScope: this.rootScopeMock,
          $scope: this.scope,
          ASTrackerSubscriptionService: ASTrackerSubscriptionService
        });

        this.scope.$emit('collaboration:join', {test: 'pipo'});
        this.checkRoomJoinCalled(done);
      });

      it('should do nothing if the event data does not contain a collaboration with an objectType', function(done) {
        var ASTrackerSubscriptionService = {
          get: function() {
            done('should not have been called');
          }
        };

        this.controller('ASTrackerController', {
          $rootScope: this.rootScopeMock,
          $scope: this.scope,
          ASTrackerSubscriptionService: ASTrackerSubscriptionService
        });

        var eventData = {
          collaboration: {
            _id: 123
          }
        };
        this.scope.$emit('collaboration:join', eventData);
        this.checkRoomJoinCalled(done);
      });

      it('should call the onJoin method of all handlers returned by ASTrackerSubscriptionService', function() {
        var objectType = 'aCollab';
        var eventData = {
          collaboration: {
            objectType: objectType
          }
        };

        var handlerIds = ['h1', 'h2', 'h3'];
        var calledHandlers = [];
        var ASTrackerSubscriptionService = {
          get: function(collabType) {
            expect(collabType).to.equal(objectType);
            return handlerIds.map(function(id) {
              return {
                onJoin: function(data) {
                  expect(data).to.deep.equal(eventData);
                  calledHandlers.push(id);
                }
              };
            });
          }
        };

        this.controller('ASTrackerController', {
          $rootScope: this.$rootScope,
          $scope: this.scope,
          ASTrackerSubscriptionService: ASTrackerSubscriptionService
        });

        this.scope.$emit('collaboration:join', eventData);
        expect(calledHandlers).to.deep.equal(handlerIds);
      });

      it('should not throw an error if the onJoin method of an handler fails', function(done) {
        var objectType = 'aCollab';
        var eventData = {
          collaboration: {
            objectType: objectType
          }
        };

        var ASTrackerSubscriptionService = {
          get: function(collabType) {
            expect(collabType).to.equal(objectType);
            return [
              {
                onJoin: function(data) {
                  expect(data).to.deep.equal(eventData);
                  throw new Error('a error that should be caught');
                }
              },
              {
                onJoin: function(data) {
                  expect(data).to.deep.equal(eventData);
                }
              }];
          }
        };

        this.controller('ASTrackerController', {
          $rootScope: this.$rootScope,
          $scope: this.scope,
          ASTrackerSubscriptionService: ASTrackerSubscriptionService,
          $log: {
            debug: function() {},
            error: function(msg, exception) {
              expect(exception).to.exist;
              done();
            }
          }
        });

        this.scope.$emit('collaboration:join', eventData);
      });

    });

    describe('on collaboration:leave event', function() {

      beforeEach(function() {
        var self = this;
        this.roomLeaveCalled = false;
        this.rootScopeMock = {
          $on: function(eventName, eventCallback) {
            if (eventName === 'collaboration:leave') {
              self.$rootScope.$on(eventName, eventCallback);
              self.roomLeaveCalled = true;
            }
          }
        };

        this.checkRoomLeaveCalled = function(done) {
          setInterval(function() {
            if (self.roomLeaveCalled) {
              clearInterval();
              done();
            }
          }, 25);
        };
      });

      it('should do nothing if the event has no attached data', function(done) {
        var ASTrackerSubscriptionService = {
          get: function() {
            done('should not have been called');
          }
        };

        this.controller('ASTrackerController', {
          $rootScope: this.rootScopeMock,
          $scope: this.scope,
          ASTrackerSubscriptionService: ASTrackerSubscriptionService
        });

        this.scope.$emit('collaboration:leave');
        this.checkRoomLeaveCalled(done);
      });

      it('should do nothing if the event data does not contain a collaboration', function(done) {
        var ASTrackerSubscriptionService = {
          get: function() {
            done('should not have been called');
          }
        };

        this.controller('ASTrackerController', {
          $rootScope: this.rootScopeMock,
          $scope: this.scope,
          ASTrackerSubscriptionService: ASTrackerSubscriptionService
        });

        this.scope.$emit('collaboration:leave', {test: 'pipo'});
        this.checkRoomLeaveCalled(done);
      });

      it('should do nothing if the event data does not contain a collaboration with an objectType', function(done) {
        var ASTrackerSubscriptionService = {
          get: function() {
            done('should not have been called');
          }
        };

        this.controller('ASTrackerController', {
          $rootScope: this.rootScopeMock,
          $scope: this.scope,
          ASTrackerSubscriptionService: ASTrackerSubscriptionService
        });

        var eventData = {
          collaboration: {
            _id: 123
          }
        };
        this.scope.$emit('collaboration:leave', eventData);
        this.checkRoomLeaveCalled(done);
      });

      it('should call the onLeave method of all handlers returned by ASTrackerSubscriptionService', function() {
        var objectType = 'aCollab';
        var eventData = {
          collaboration: {
            objectType: objectType
          }
        };

        var handlerIds = ['h1', 'h2', 'h3'];
        var calledHandlers = [];
        var ASTrackerSubscriptionService = {
          get: function(collabType) {
            expect(collabType).to.equal(objectType);
            return handlerIds.map(function(id) {
              return {
                onLeave: function(data) {
                  expect(data).to.deep.equal(eventData);
                  calledHandlers.push(id);
                }
              };
            });
          }
        };

        this.controller('ASTrackerController', {
          $rootScope: this.$rootScope,
          $scope: this.scope,
          ASTrackerSubscriptionService: ASTrackerSubscriptionService
        });

        this.scope.$emit('collaboration:leave', eventData);
        expect(calledHandlers).to.deep.equal(handlerIds);
      });

      it('should not throw an error if the onLeave method of an handler fails', function(done) {
        var objectType = 'aCollab';
        var eventData = {
          collaboration: {
            objectType: objectType
          }
        };

        var ASTrackerSubscriptionService = {
          get: function(collabType) {
            expect(collabType).to.equal(objectType);
            return [{
              onLeave: function(data) {
                expect(data).to.deep.equal(eventData);
                throw new Error('a error that should be caught');
              }
            }, {
              onLeave: function(data) {
                expect(data).to.deep.equal(eventData);
              }
            }];
          }
        };

        this.controller('ASTrackerController', {
          $rootScope: this.$rootScope,
          $scope: this.scope,
          ASTrackerSubscriptionService: ASTrackerSubscriptionService,
          $log: {
            debug: function() {},
            error: function(msg, exception) {
              expect(exception).to.exist;
              done();
            }
          }
        });

        this.scope.$emit('collaboration:leave', eventData);
      });

    });

  });

  describe('ASTrackerNotificationService', function() {

    beforeEach(function() {
      var self = this;

      this.livenotificationCallback = function() {};
      this.livenotification = function(namespace, id) {
        if (self.livenotificationCallback) {
          return self.livenotificationCallback(namespace, id);
        }
      };

      this.rootScope = {};

      angular.mock.module(function($provide) {
        $provide.value('livenotification', self.livenotification);
        $provide.value('$rootScope', self.rootScope);
      });
    });

    beforeEach(angular.mock.inject(function(ASTrackerNotificationService) {
      this.ASTrackerNotificationService = ASTrackerNotificationService;
    }));

    describe('removeItem function', function() {
      beforeEach(function() {
        this.streams = [
          {uuid: 'as1'}, {uuid: 'as2'}, {uuid: 'as3'}
        ];
        this.streams.forEach(this.ASTrackerNotificationService.addItem, this);
      });

      it('should do nothing if no stream id is provided', function() {
        this.ASTrackerNotificationService.removeItem();
        expect(this.ASTrackerNotificationService.streams).to.deep.equal(this.streams);
      });

      it('should remove the activityStream from the given id', function() {
        this.ASTrackerNotificationService.removeItem('as2');
        expect(this.ASTrackerNotificationService.streams).to.deep.equal([
          {uuid: 'as1'}, {uuid: 'as3'}
        ]);
      });

      it('should do nothing if the provided id is not stored in the service', function() {
        this.ASTrackerNotificationService.removeItem('aRandomId');
        expect(this.ASTrackerNotificationService.streams).to.deep.equal(this.streams);
      });
    });

    describe('updateUnread function', function() {
      it('should do nothing if no stream stored in the service', function() {
        var streamsBefore = angular.copy(this.ASTrackerNotificationService.streams);
        this.ASTrackerNotificationService.updateUnread('anUUID', 10);
        expect(this.ASTrackerNotificationService.streams).to.deep.equal(streamsBefore);
      });

      it('should do nothing if the stream to update is not stored in the service', function() {
        this.ASTrackerNotificationService.addItem({uuid: 'uuid1'});
        this.ASTrackerNotificationService.addItem({uuid: 'uuid2'});
        this.ASTrackerNotificationService.addItem({uuid: 'uuid3'});
        var streamsBefore = angular.copy(this.ASTrackerNotificationService.streams);
        this.ASTrackerNotificationService.updateUnread('anotherUUID', 10);
        expect(this.ASTrackerNotificationService.streams).to.deep.equal(streamsBefore);
      });

      it('should update the unread count of the given activity stream', function() {
        this.ASTrackerNotificationService.addItem({uuid: 'uuid1'});
        this.ASTrackerNotificationService.addItem({uuid: 'uuid2'});
        this.ASTrackerNotificationService.addItem({uuid: 'uuid3'});
        this.ASTrackerNotificationService.updateUnread('uuid2', 10);
        expect(this.ASTrackerNotificationService.streams).to.deep.equal([
            {uuid: 'uuid1'}, {uuid: 'uuid2', unread_count: 10}, {uuid: 'uuid3'}
        ]);
      });
    });

    describe('subscribeToStreamNotification function', function() {
      it('should return true and subscribe to a socketIO room', function() {
        var streamId = 'uuid';
        this.livenotificationCallback = function(namespace, id) {
          expect(namespace).to.equal('/activitystreams');
          expect(id).to.equal(streamId);
          return {
            on: function() {}
          };
        };
        expect(this.ASTrackerNotificationService.subscribeToStreamNotification(streamId)).to.be.true;
      });

      it('should return false if there already is a subscription for this stream', function() {
        var streamId = 'anUUID';
        this.livenotificationCallback = function(namespace, id) {
          expect(namespace).to.equal('/activitystreams');
          expect(id).to.equal(streamId);
          return {
            on: function() {
              return 'socketIORoom';
            }
          };
        };
        this.ASTrackerNotificationService.subscribeToStreamNotification(streamId);
        this.livenotificationCallback = function() {
          throw new Error('Should not be called anymore !');
        };
        expect(this.ASTrackerNotificationService.subscribeToStreamNotification(streamId)).to.be.false;
      });
    });

    describe('getUnreadUpdate function', function() {
      it('should update the acitvtyStream unread count to 0 and emit on rootscope', function() {
        var streamId = 'uuid';

        this.rootScope.$emit = function(eventName, eventData) {
          expect(eventName).to.equal('activitystream:userUpdateRequest');
          expect(eventData).to.deep.equal({
            activitystreamUuid: streamId
          });
        };

        this.ASTrackerNotificationService.updateUnread = function(id, count) {
          expect(id).to.equal(streamId);
          expect(count).to.equal(0);
        };

        this.ASTrackerNotificationService.getUnreadUpdate(streamId);
      });
    });

  });

  describe('ASTrackerSubscriptionService function', function() {

    beforeEach(function() {
      var self = this;
      this.ASTrackerNotificationService = {};
      angular.mock.module(function($provide) {
        $provide.value('ASTrackerNotificationService', self.ASTrackerNotificationService);
      });
    });

    beforeEach(angular.mock.inject(function(ASTrackerSubscriptionService) {
      this.ASTrackerSubscriptionService = ASTrackerSubscriptionService;
    }));

    describe('register function', function() {
      it('should register nothing if handler parameter is not defined', function() {
        var objectType = 'objectType';
        this.ASTrackerSubscriptionService.register(objectType);
        expect(this.ASTrackerSubscriptionService.get(objectType)).to.deep.equal([]);
      });

      it('should register wrapped handlers for the given objectType', function() {
        var objectType = 'objectType';
        var handler1 = {
          fake: function() {}
        };
        this.ASTrackerSubscriptionService.register(objectType, handler1);
        var registered = this.ASTrackerSubscriptionService.get(objectType);
        expect(registered).to.have.length(1);
        expect(registered[0].onJoin).to.exist;
        expect(registered[0].onLeave).to.exist;

        var handler2 = {
          fake: 'fakeString'
        };
        this.ASTrackerSubscriptionService.register(objectType, handler2);
        registered = this.ASTrackerSubscriptionService.get(objectType);
        expect(registered).to.have.length(2);
        expect(registered[0].onJoin).to.exist;
        expect(registered[0].onLeave).to.exist;
        expect(registered[1].onJoin).to.exist;
        expect(registered[1].onLeave).to.exist;
      });
    });

    describe('get function', function() {
      it('should return empty array if objectType parameter is undefined', function() {
        expect(this.ASTrackerSubscriptionService.get()).to.deep.equal([]);
      });

      it('should return empty array if no handler was registered for the given objectType', function() {
        expect(this.ASTrackerSubscriptionService.get('objectType')).to.deep.equal([]);
      });

      it('should return the array of transformed handlers registered for the given objectType', function() {
        var objectType = 'objectType';
        var handler1 = {
          fake: function() {}
        };
        this.ASTrackerSubscriptionService.register(objectType, handler1);
        var handler2 = {
          fake: 'fakeString'
        };
        this.ASTrackerSubscriptionService.register(objectType, handler2);
        expect(this.ASTrackerSubscriptionService.get(objectType)).to.have.length(2);
      });
    });

  });


});
