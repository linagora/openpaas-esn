'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.activitystream Angular module', function() {

  describe('activitystreamNotification directive', function() {
    var callbackOnWeakInfo;
    var callbackOnNotification;

    var sessionId = '12345';

    beforeEach(function() {
      module('jadeTemplates');

      var asMoment = function() {
        return {
          fromNow: function() {}
        };
      };

      var asSession = {
        user: {
          _id: sessionId,
          emails: ['user1@test.com']
        },
        domain: {
          company_name: 'test'
        }
      };

      var asNotificationFactory = {
        weakInfo: function(title, text) {
          callbackOnWeakInfo(title, text);
        }
      };

      var asSocket = function() {
        return {
          emit: function() {},
          on: function(event, callback) {
            callbackOnNotification = callback;
          },
          removeListener: function() {}
        };
      };

      angular.mock.module('esn.activitystream');
      angular.mock.module('esn.websocket');
      angular.mock.module('esn.notification');
      angular.mock.module(function($provide) {
        $provide.value('moment', asMoment);
        $provide.value('session', asSession);
        $provide.value('notificationFactory', asNotificationFactory);
        $provide.value('socket', asSocket);
      });
    });

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();
    }]));

    afterEach(function() {
      callbackOnWeakInfo = null;
      callbackOnNotification = null;
    });

    it('should do nothing if socket message has no field actor', function(done) {
      callbackOnWeakInfo = function() {
        done(new Error('Should not have been called'));
      };
      this.$scope.activitystream = {activity_stream: {uuid: '0987654321'}};
      var html = '<div activity-stream-notification></div>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {};
      callbackOnNotification({room: this.$scope.activitystream.activity_stream.uuid, data: msg});
      done();
    });

    it('should call the method "notificationFactory.weakInfo(title, text)"', function(done) {
      callbackOnWeakInfo = function(title, text) {
        expect(title).to.exist;
        expect(text).to.exist;
        done();
      };

      this.$scope.activitystream = {activity_stream: {uuid: '0987654321'}};
      var html = '<div activity-stream-notification></div>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        actor: {
          _id: '123',
          displayName: ''
        },
        published: ''
      };
      callbackOnNotification({room: this.$scope.activitystream.activity_stream.uuid, data: msg});
    });

    it('should update scope.asMessagesUpdates.post if socket message verb is post', function() {
      callbackOnWeakInfo = function() {};
      this.$scope.activitystream = {activity_stream: {uuid: '0987654321'}};
      var html = '<div activity-stream-notification></div>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        actor: {
          _id: '123',
          displayName: ''
        },
        verb: 'post'
      };
      callbackOnNotification({room: this.$scope.activitystream.activity_stream.uuid, data: msg});
      expect(this.$scope.asMessagesUpdates).to.deep.equal({post: [msg], update: []});
    });

    it('should update scope.asMessagesUpdates.post if socket message verb is update' +
    ' and the message is not already known', function() {
      callbackOnWeakInfo = function() {};
      this.$scope.activitystream = {activity_stream: {uuid: '0987654321'}};
      var html = '<div activity-stream-notification></div>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        actor: {
          _id: '123',
          displayName: ''
        },
        verb: 'update'
      };
      callbackOnNotification({room: this.$scope.activitystream.activity_stream.uuid, data: msg});
      expect(this.$scope.asMessagesUpdates).to.deep.equal({post: [], update: [msg]});
    });

    it('should not update scope.asMessagesUpdates.post if socket message verb is update' +
    ' and the message is already known', function() {
      callbackOnWeakInfo = function() {};
      this.$scope.activitystream = {activity_stream: {uuid: '0987654321'}};
      var html = '<div activity-stream-notification></div>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        object: {
          _id: 'msgObjectId'
        },
        actor: {
          _id: '123',
          displayName: ''
        },
        verb: 'update'
      };
      this.$scope.asMessagesUpdates = {post: [msg], update: []};
      callbackOnNotification({room: this.$scope.activitystream.activity_stream.uuid, data: msg});
      expect(this.$scope.asMessagesUpdates).to.deep.equal({post: [msg], update: []});
    });

    it('should not call the method "notificationFactory.weakInfo(title, text)" ' +
      'if the actor._id is equal to session.user._id', function(done) {
      callbackOnWeakInfo = function() {
        done(new Error('Should not pass here'));
      };

      this.$scope.activitystream = {activity_stream: {uuid: '0987654321'}};
      var html = '<div activity-stream-notification></div>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        actor: {
          _id: sessionId,
          displayName: ''
        },
        published: ''
      };
      callbackOnNotification({room: this.$scope.activitystream.activity_stream.uuid, data: msg});
      done();
    });

    it('should not call the method "notificationFactory.weakInfo(title, text)" ' +
      'if the room and activity stream uuid is different', function(done) {
      callbackOnWeakInfo = function() {
        done(new Error('Should not pass here'));
      };

      this.$scope.activitystream = {activity_stream: {uuid: '0987654321'}};
      var html = '<div activity-stream-notification></div>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        actor: {
          _id: '123',
          displayName: ''
        },
        published: ''
      };
      callbackOnNotification({room: '098765', data: msg});
      done();
    });
  });


  describe('activitystream directive', function() {
    beforeEach(module('jadeTemplates'));
    beforeEach(module('esn.core'));
    beforeEach(module('esn.infinite-list'));

    beforeEach(function() {
      module('jadeTemplates');
      angular.mock.module('esn.activitystream');
      angular.mock.module('esn.collaboration');
    });
    beforeEach(inject(['$compile', '$rootScope', '$timeout', '$httpBackend', 'Restangular', function($c, $r, $t, $h, R) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();
      this.$timeout = $t;
      this.$httpBackend = $h;
      R.setFullResponse(true);

      this.initASDirective = function() {
        var html = '<activity-stream activitystream="activitystream" streams="streams"></activity-stream>';
        var element = this.$compile(html)(this.$scope);
        this.$rootScope.$digest();
        var scope = element.isolateScope();
        scope.loadMoreElements = function() {};
        return scope;
      };
    }]));

    it('should call scope.loadMoreElements() method', function(done) {
      this.$scope.streams = [];
      this.$scope.stream = {_id: '123', activity_stream: {uuid: '0987654321'}};
      var html = '<activity-stream activitystream="stream" streams="streams"></activity-stream>';
      var element = this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      var scope = element.isolateScope();
      scope.loadMoreElements = done;
      this.$timeout.flush();
    });

    describe('when "message:posted" event is emitted', function() {
      it('should do nothing if message.activitystreamUuid is not one the scope streams', function(done) {
        this.$scope.activitystream = {_id: '123', activity_stream: {uuid: '0987654321'}};
        var scope = this.initASDirective();
        scope.getStreamUpdates = function() {
          return done(new Error('Should not have been called'));
        };
        this.$timeout.flush();
        this.$rootScope.$emit('message:posted', {activitystreamUuid: 'anotherASId'});
        done();
      });


      it('should do nothing if a rest call is already active for the message activityStreamUuid', function(done) {
        var uuid = '0987654321';
        this.$scope.activitystream = {_id: '123', activity_stream: {uuid: uuid}};
        var scope = this.initASDirective();
        scope.getStreamUpdates = function() {
          return done(new Error('Should not have been called'));
        };
        this.$timeout.flush();
        scope.restActive = {};
        scope.restActive[uuid] = true;
        scope.restActive.anotherId = true;
        this.$rootScope.$emit('message:posted', {activitystreamUuid: uuid});
        done();
      });

      it('should do nothing if a rest call to update the messages is already active', function(done) {
        var uuid = '0987654321';
        this.$scope.activitystream = {_id: '123', activity_stream: {uuid: uuid}};
        var scope = this.initASDirective();
        scope.getStreamUpdates = function() {
          return done(new Error('Should not have been called'));
        };
        this.$timeout.flush();
        scope.updateMessagesActive = true;
        this.$rootScope.$emit('message:posted', {activitystreamUuid: uuid});
        done();
      });

      it('should call scope.getStreamUpdates() method with scope.activitystream.uuid', function(done) {
        var uuid = '0987654321';
        this.$scope.streams = [];
        this.$scope.activitystream = {_id: '123', activity_stream: {uuid: uuid}};
        var scope = this.initASDirective();
        scope.getStreamUpdates = function(id) {
          expect(id).to.equals(uuid);
          return done();
        };
        this.$timeout.flush();
        this.$rootScope.$emit('message:posted', {activitystreamUuid: uuid});
      });

      it('should update scope.lastPost.messageId', function() {
        this.$scope.streams = [];
        this.$scope.activitystream = {_id: '123', activity_stream: {uuid: '0987654321'}};
        var scope = this.initASDirective();
        scope.getStreamUpdates = function() {};
        this.$timeout.flush();
        this.$rootScope.$emit('message:posted', {activitystreamUuid: '0987654321', id: 'msg42'});
        expect(scope.lastPost.messageId).to.equal('msg42');
      });
    });

    describe('when "message:comment" event is emitted', function() {
      it('should ignore the event when the comment parent is not in the threads', function() {
        this.$scope.activitystream = {_id: '123', activity_stream: {uuid: '0987654321'}};
        var scope = this.initASDirective();
        this.$timeout.flush();

        scope.threads.push(
          {_id: 'msg1', responses: [{_id: 'cmt1'}] },
          {_id: 'msg2', responses: [{_id: 'cmt2'}] },
          {_id: 'msg3', responses: [{_id: 'cmt3'}] }
        );
        this.$rootScope.$emit('message:comment', {parent: {_id: 'msg33'}});
      });

      it('should only update scope.lastPost.Comment if scope.updateMessagesActive is true', function() {
        this.$scope.activitystream = {_id: '123', activity_stream: {uuid: '0987654321'}};
        var scope = this.initASDirective();
        scope.threads = [{_id: 'parentId', responses: [{_id: 'cmt1'}], shares: [] }];
        scope.updateMessagesActive = true;
        this.$rootScope.$emit('message:comment', {id: 'commentId', parent: {_id: 'parentId'}});
        expect(scope.lastPost.comment).to.deep.equal({
          parentId: 'parentId',
          id: 'commentId'
        });
      });

      it('should only update scope.lastPost.Comment if a rest call is already running for the message', function() {
        this.$scope.activitystream = {_id: '123', activity_stream: {uuid: '0987654321'}};
        var scope = this.initASDirective();
        scope.threads = [{_id: 'parentId', responses: [{_id: 'cmt1'}], shares: [{objectType: 'activitystream', id: 'shareId'}] }];
        scope.restActive = {shareId: true};
        this.$rootScope.$emit('message:comment', {id: 'commentId', parent: {_id: 'parentId'}});
        expect(scope.lastPost.comment).to.deep.equal({
          parentId: 'parentId',
          id: 'commentId'
        });
      });

      it('should update the thread comments method', function() {
        this.$scope.activitystream = {_id: '123', activity_stream: {uuid: '0987654321'}};
        var scope = this.initASDirective();
        this.$timeout.flush();

        this.$httpBackend.expectGET('/messages/msg2').respond({
          _id: 'msg2',
          responses: [
            {_id: 'cmt2'},
            {_id: 'cmt4'}
          ],
          shares: []
        });

        scope.threads.push(
          {_id: 'msg1', responses: [{_id: 'cmt1'}], shares: [] },
          {_id: 'msg2', responses: [{_id: 'cmt2'}], shares: [] },
          {_id: 'msg3', responses: [{_id: 'cmt3'}], shares: [] }
        );
        this.$rootScope.$emit('message:comment', {parent: {_id: 'msg2'}});
        this.$httpBackend.flush();
        expect(scope.threads[1].responses).to.have.length(2);
      });

      it('should update scope.lastPost.comment', function() {
        this.$scope.activitystream = {_id: '123', activity_stream: {uuid: '0987654321'}};
        var scope = this.initASDirective();
        this.$timeout.flush();

        this.$httpBackend.expectGET('/messages/msg2').respond({
          _id: 'msg2',
          responses: [
            {_id: 'cmt2'},
            {_id: 'cmt4'}
          ]
        });

        scope.threads.push(
          {_id: 'msg1', responses: [{_id: 'cmt1'}], shares: [] },
          {_id: 'msg2', responses: [{_id: 'cmt2'}], shares: [{objectType: 'activitystream', id: '0987654321'}] },
          {_id: 'msg3', responses: [{_id: 'cmt3'}], shares: [] }
        );
        this.$rootScope.$emit('message:comment', {parent: {_id: 'msg2'}, id: 'cmt1'});
        this.$httpBackend.flush();
        expect(scope.lastPost.comment).to.deep.equal({id: 'cmt1', parentId: 'msg2'});
      });
    });
  });


  describe('activityStreamFilter directive', function() {

    beforeEach(function() {
      module('jadeTemplates');

      this.asLog = {
        debug: function() {}
      };
      this.storageService = {};

      angular.mock.module('esn.activitystream');
      var self = this;
      angular.mock.module(function($provide) {
        $provide.value('$log', self.asLog);
        $provide.value('localStorageService', self.storageService);
      });
    });

    beforeEach(function() {
      angular.mock.inject(function($compile, $rootScope, $q) {
        this.$compile = $compile;
        this.$rootScope = $rootScope;
        this.$q = $q;
        this.$scope = this.$rootScope.$new();
      });
    });

    it('should not initiate scope.selectedStream if local storage is empty', function() {
      var ASId = 'activityStreamId';
      this.$scope.activitystream = {
        _id: ASId
      };
      this.$scope.streams = [];

      var self = this;
      this.storageService.getOrCreateInstance = function(storageName) {
        expect(storageName).to.equal('streamFilters');
        return {
          getItem: function(itemName) {
            expect(itemName).to.equal(ASId);
            var defer = self.$q.defer();
            defer.resolve({});
            return defer.promise;
          }
        };
      };

      var html = '<activity-stream-filter></activity-stream-filter>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(this.$scope.selectedStream).to.not.exist;
    });

    it('should initiate scope.selectedStream from local storage', function() {
      var ASId = 'activityStreamId';
      var ASUUID = 'asUUID';
      this.$scope.activitystream = {
        activity_stream: {
          uuid: ASUUID
        },
        _id: ASId
      };
      this.$scope.streams = [{activity_stream: {uuid: ASUUID}}];

      var self = this;
      this.storageService.getOrCreateInstance = function(storageName) {
        expect(storageName).to.equal('streamFilters');
        return {
          getItem: function(itemName) {
            expect(itemName).to.equal(ASId);
            var defer = self.$q.defer();
            defer.resolve(ASUUID);
            return defer.promise;
          }
        };
      };

      var html = '<activity-stream-filter></activity-stream-filter>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();

      expect(this.$scope.selectedStream).to.deep.equal(this.$scope.streams[0]);
    });

    describe('selectStream function', function() {
      it('should store the selected stream in local storage', function(done) {
        this.$scope.activitystream = {
          _id: 'ASId'
        };
        this.$scope.streams = [];

        var selectedStream = {
          activity_stream: {
            uuid: 'ASUUID'
          }
        };
        var self = this;
        this.storageService.getOrCreateInstance = function(storageName) {
          expect(storageName).to.equal('streamFilters');
          return {
            getItem: function() {
              var defer = self.$q.defer();
              defer.resolve({});
              return defer.promise;
            },
            setItem: function() {
              expect(self.$scope.selectedStream).to.deep.equal(selectedStream);
              done();
            }
          };
        };

        var html = '<activity-stream-filter></activity-stream-filter>';
        this.$compile(html)(this.$scope);
        this.$rootScope.$digest();
        this.$scope.selectStream(selectedStream);
      });
    });

    describe('clearStreamSelection function', function() {
      it('should clean the local storage for activtystream filters', function(done) {
        this.$scope.activitystream = {
          _id: 'ASId'
        };
        this.$scope.streams = [];

        var self = this;
        this.storageService.getOrCreateInstance = function(storageName) {
          expect(storageName).to.equal('streamFilters');
          return {
            getItem: function() {
              var defer = self.$q.defer();
              defer.resolve({});
              return defer.promise;
            },
            removeItem: function(item) {
              expect(item).to.equal(self.$scope.activitystream._id);
              done();
            }
          };
        };

        var html = '<activity-stream-filter></activity-stream-filter>';
        this.$compile(html)(this.$scope);
        this.$rootScope.$digest();
        this.$scope.clearStreamSelection();
      });
    });

  });

});
