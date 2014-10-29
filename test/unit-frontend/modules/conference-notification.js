'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.conference-notification Angular module', function() {
  var callbackOnWeakInfo;
  var callbackOnConfirm;
  var callbackOnNotification;

  beforeEach(function() {
    module('jadeTemplates');

    var asNotificationFactory = {
      weakInfo: function(title, text) {
        callbackOnWeakInfo(title, text);
      },
      confirm: function(title, text, icon, buttons, data, handlerConfirm, handlerCancel) {
        callbackOnConfirm(title, text, icon, buttons, data, handlerConfirm, handlerCancel);
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

    angular.mock.module('esn.conference-notification');
    angular.mock.module('esn.websocket');
    angular.mock.module('esn.notification');
    angular.mock.module(function($provide) {
      $provide.value('notificationFactory', asNotificationFactory);
      $provide.value('socket', asSocket);
    });
  });

  afterEach(function() {
    callbackOnWeakInfo = null;
    callbackOnConfirm = null;
    callbackOnNotification = null;
  });

  describe('conferenceNotification directive', function() {
    var sessionId = '12345';

    beforeEach(function() {
      module('jadeTemplates');

      var asSession = {
        user: {
          _id: sessionId
        }
      };

      angular.mock.module(function($provide) {
        $provide.value('session', asSession);
      });
    });
    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();
    }]));

    it('should call the method "notificationFactory.weakInfo(title, text)"', function(done) {
      callbackOnWeakInfo = function(title, text) {
        expect(title).to.exist;
        expect(text).to.exist;
        done();
      };

      var html = '<conference-notification conference-id="0987654321"></conference-notification>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        user_id: '1234',
        message: ''
      };
      callbackOnNotification({room: '0987654321', data: msg});
    });

    it('should not call the method "notificationFactory.weakInfo(title, text)" ' +
      'if the user_id is equal to session.user._id', function(done) {
      callbackOnWeakInfo = function() {
        done(new Error('Should not pass here'));
      };

      var html = '<conference-notification conference-id="0987654321"></conference-notification>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        user_id: sessionId,
        message: ''
      };
      callbackOnNotification({room: '0987654321', data: msg});
      // Wait to see if the callback is called
      setTimeout(function() {
        done();
      }, 100);
    });

    it('should not call the method "notificationFactory.weakInfo(title, text)" ' +
      'if the room and conference id is different', function(done) {
      callbackOnWeakInfo = function() {
        done(new Error('Should not pass here'));
      };

      var html = '<conference-notification conference-id="0987654321"></conference-notification>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        user_id: '1234',
        message: ''
      };
      callbackOnNotification({room: '098765', data: msg});
      // Wait to see if the callback is called
      setTimeout(function() {
        done();
      }, 100);
    });
  });

  describe('conferenceInvitationNotification directive', function() {
    var callbackWindowOpen;

    beforeEach(function() {
      module('jadeTemplates');

      var as$window = {
        open: function() {
          callbackWindowOpen();
        },
        document: [{}]
      };

      var as$timeout = function(fn) {
        fn();
      };

      var as$log = {
        debug: function() {}
      };

      angular.mock.module(function($provide) {
        $provide.value('$window', as$window);
        $provide.value('$timeout', as$timeout);
        $provide.value('$log', as$log);
      });
    });
    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();
    }]));

    it('should call the method "notificationFactory.confirm()" and call "$window.open()"', function(done) {
      var msg = {
        content: 'test',
        conference_id: '12345'
      };

      callbackWindowOpen = function() {
        done();
      };

      callbackOnConfirm = function(title, text, icon, buttons, data, handlerConfirm, handlerCancel) {
        expect(title).to.exist;
        expect(text).to.exist;
        expect(data).to.deep.equal(msg);
        handlerConfirm(data);
      };

      var html = '<conference-invitation-notification></conference-invitation-notification>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      callbackOnNotification(msg);
    });

    it('should call the method "notificationFactory.confirm()" but not call "$window.open()" ' +
      'if conference_id is not defined', function(done) {
      var msg = {
        content: 'test'
      };

      callbackWindowOpen = function() {
        done(new Error('Should not pass here'));
      };

      callbackOnConfirm = function(title, text, icon, buttons, data, handlerConfirm, handlerCancel) {
        expect(title).to.exist;
        expect(text).to.exist;
        expect(data).to.deep.equal(msg);
        handlerConfirm(data);
        // Wait to see if "callbackWindowOpen" is called
        setTimeout(function() {
          done();
        }, 100);
      };

      var html = '<conference-invitation-notification></conference-invitation-notification>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      callbackOnNotification(msg);
    });
  });
});
