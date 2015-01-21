'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.activitystream Angular module', function() {
  describe('activitystreamNotification directive', function() {
    beforeEach(function() {
      this.livenotification = {
        of: function(namespace) { this.namespace = namespace; return this; },
        subscribe: function(uuid) { this.uuid = uuid; return this; },
        onNotification: function(callback) {
          callback({
            actor: {_id: 'user1'},
            message: 'a new notification'
          });
        }
      };
      this.asNotificationService = {
        notify: function() {}
      };
      angular.mock.module('esn.activitystream');
      module('jadeTemplates');
    });
  });

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
          _id: sessionId
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

    it('should call the method "notificationFactory.weakInfo(title, text)"', function(done) {
      callbackOnWeakInfo = function(title, text) {
        expect(title).to.exist;
        expect(text).to.exist;
        done();
      };

      this.$scope.activitystreamUuid = '0987654321';
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
      callbackOnNotification({room: this.$scope.activitystreamUuid, data: msg});
    });

    it('should not call the method "notificationFactory.weakInfo(title, text)" ' +
      'if the actor._id is equal to session.user._id', function(done) {
      callbackOnWeakInfo = function() {
        done(new Error('Should not pass here'));
      };

      this.$scope.activitystreamUuid = '0987654321';
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
      callbackOnNotification({room: this.$scope.activitystreamUuid, data: msg});
      // Wait to see if the callback is called
      setTimeout(function() {
        done();
      }, 100);
    });

    it('should not call the method "notificationFactory.weakInfo(title, text)" ' +
      'if the room and activity stream uuid is different', function(done) {
      callbackOnWeakInfo = function() {
        done(new Error('Should not pass here'));
      };

      this.$scope.activitystreamUuid = '0987654321';
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
      // Wait to see if the callback is called
      setTimeout(function() {
        done();
      }, 100);
    });
  });

  describe('activitystream directive', function() {
    beforeEach(module('jadeTemplates'));
    beforeEach(module('esn.core'));

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
    it('should call scope.getStreamUpdates() method when a "message:posted" event is emitted with this activitystream uuid', function(done) {
      var uuid = '0987654321';
      this.$scope.streams = [];
      this.$scope.activitystream = {_id: '123', activity_stream: {uuid: uuid}};
      var html = '<activity-stream activitystream="activitystream" streams="streams"></activity-stream>';
      var element = this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      var scope = element.isolateScope();
      scope.loadMoreElements = function() {};
      scope.getStreamUpdates = function(id) {
        expect(id).to.equals(uuid);
        return done();
      };
      this.$timeout.flush();
      this.$rootScope.$emit('message:posted', {activitystreamUuid: '0987654321'});
    });
    it('should update scope.lastPost.messageId when a "message:posted" event is emitted with this activitystream uuid', function() {
      this.$scope.streams = [];
      this.$scope.activitystream = {_id: '123', activity_stream: {uuid: '0987654321'}};
      var html = '<activity-stream activitystream="activitystream" streams="streams"></activity-stream>';
      var element = this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      var scope = element.isolateScope();
      scope.loadMoreElements = function() {};
      scope.getStreamUpdates = function() {};
      this.$timeout.flush();
      this.$rootScope.$emit('message:posted', {activitystreamUuid: '0987654321', id: 'msg42'});
      expect(scope.lastPost.messageId).to.equal('msg42');
    });
    it('should update the thread comments method when a "message:comment" event is emitted', function() {
      this.$scope.streams = [];
      this.$scope.activitystream = {_id: '123', activity_stream: {uuid: '0987654321'}};
      var html = '<activity-stream activitystream="activitystream" streams="streams"></activity-stream>';
      var element = this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      var scope = element.isolateScope();
      scope.loadMoreElements = function() {};
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

    it('should update scope.lastPost.comment when a "message:comment" event is emitted', function() {
      this.$scope.streams = [];
      this.$scope.activitystream = {_id: '123', activity_stream: {uuid: '0987654321'}};
      var html = '<activity-stream activitystream="activitystream" streams="streams"></activity-stream>';
      var element = this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      var scope = element.isolateScope();
      scope.loadMoreElements = function() {};
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
        {_id: 'msg2', responses: [{_id: 'cmt2'}], shares: [] },
        {_id: 'msg3', responses: [{_id: 'cmt3'}], shares: [] }
      );
      this.$rootScope.$emit('message:comment', {parent: {_id: 'msg2'}, id: 'cmt1'});
      this.$httpBackend.flush();
      expect(scope.lastPost.comment).to.deep.equal({id: 'cmt1', parentId: 'msg2'});
    });

    it('should ignore "message:comment" events when the comment parent is not in the threads', function() {
      this.$scope.streams = [];
      this.$scope.activitystream = {_id: '123', activity_stream: {uuid: '0987654321'}};
      var html = '<activity-stream activitystream="activitystream" streams="streams"></activity-stream>';
      var element = this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      var scope = element.isolateScope();
      scope.loadMoreElements = function() {};
      this.$timeout.flush();

      scope.threads.push(
        {_id: 'msg1', responses: [{_id: 'cmt1'}] },
        {_id: 'msg2', responses: [{_id: 'cmt2'}] },
        {_id: 'msg3', responses: [{_id: 'cmt3'}] }
      );
      this.$rootScope.$emit('message:comment', {parent: {_id: 'msg33'}});
    });
  });


});
