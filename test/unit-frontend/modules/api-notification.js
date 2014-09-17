'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.api-notification Angular module', function() {
  var callbackOnStrongInfo;
  var callbackOnNotification;

  var sessionId = '12345';

  beforeEach(function() {
    module('jadeTemplates');

    var as$log = {
      debug: function() {}
    };

    var asSession = {
      user: {
        _id: sessionId
      }
    };

    var asNotificationFactory = {
      strongInfo: function(title, text) {
        callbackOnStrongInfo(title, text);
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

    angular.mock.module('esn.api-notification');
    angular.mock.module('esn.websocket');
    angular.mock.module('esn.notification');
    angular.mock.module(function($provide) {
      $provide.value('$log', as$log);
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
    callbackOnStrongInfo = null;
    callbackOnNotification = null;
  });

  describe('apiNotification directive', function() {
    it('should call the method "notificationFactory.strongInfo(title, text)"', function(done) {
      callbackOnStrongInfo = function(title, text) {
        expect(title).to.exist;
        expect(text).to.exist;
        done();
      };

      var html = '<api-notification></api-notification>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        target: [{objectType: 'user', id: sessionId}, {objectType: 'user', id: '1234'}],
        title: '',
        author: '',
        action: '',
        object: '',
        link: ''
      };
      callbackOnNotification(msg);
    });

    it('should call the method "notificationFactory.strongInfo(title, text)" even if msg.title is undefined', function(done) {
      callbackOnStrongInfo = function(title, text) {
        expect(title).to.exist;
        expect(text).to.exist;
        done();
      };

      var html = '<api-notification></api-notification>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        target: [{objectType: 'user', id: sessionId}, {objectType: 'user', id: '1234'}],
        author: '',
        action: '',
        object: '',
        link: ''
      };
      callbackOnNotification(msg);
    });

    it('should call the method "notificationFactory.strongInfo(title, text)" ' +
      'even if msg.title, msg.author, msg.action and msg.object is undefined', function(done) {
      callbackOnStrongInfo = function(title, text) {
        expect(title).to.exist;
        expect(text).to.exist;
        done();
      };

      var html = '<api-notification></api-notification>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        target: [{objectType: 'user', id: sessionId}, {objectType: 'user', id: '1234'}],
        link: ''
      };
      callbackOnNotification(msg);
    });

    it('should not call the method "notificationFactory.strongInfo(title, text)" ' +
      'if session.user._id is not in target', function(done) {
      callbackOnStrongInfo = function() {
        done(new Error('Should not pass here'));
      };

      var html = '<api-notification></api-notification>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        target: [{objectType: 'user', id: '9876'}, {objectType: 'user', id: '123'}],
        link: ''
      };
      callbackOnNotification(msg);
      // Wait to see if the callback is called
      setTimeout(function() {
        done();
      }, 100);
    });


  });
});

