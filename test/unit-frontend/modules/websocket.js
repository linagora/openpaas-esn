'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.websocket Angular module', function() {
  describe('livenotification service', function() {
    var onCallback, emitCallback;

    beforeEach(function() {
      onCallback = function() {};
      emitCallback = function() {};
      this.asLog = {
        log: function() {}
      };
      this.asSession = {
        token: {
          token: 'token'
        },
        user: {
          _id: 'user'
        }
      };
      this.asSocket = function(namespace, options) {
        return {
          namespace: namespace,
          options: options,
          on: function(event, callback) {
            onCallback(event, callback);
          },
          emit: function(event, data) {
            emitCallback(event, data);
          }
        };
      };

      var self = this;

      angular.mock.module('esn.websocket');
      angular.mock.module(function($provide) {
        $provide.value('$log', self.asLog);
        $provide.value('session', self.asSession);
        $provide.value('socket', self.asSocket);
      });
    });

    beforeEach(inject(function(livenotification) {
      this.livenotification = livenotification;
    }));

    it('should have needed function', function() {
      expect(this.livenotification.of).to.be.a.function;
      expect(this.livenotification.subscribe).to.be.a.function;
      expect(this.livenotification.unsubscribe).to.be.a.function;
      expect(this.livenotification.onNotification).to.be.a.function;
    });

    it('should fail if subscribe called before of call', function() {
      try {
        this.livenotification.subscribe(1234).of('namespace');
      } catch (e) {
        return;
      }
      throw new Error('error');
    });

    it('should fail if unsubscribe called before of call', function() {
      try {
        this.livenotification.unsubscribe(1234);
      } catch (e) {
        return;
      }
      throw new Error('error');
    });

    it('should fail if onNotification called before of call', function() {
      try {
        this.livenotification.onNotification(1234).of('namespace');
      } catch (e) {
        return;
      }
      throw new Error('error');
    });

    it('should be ok if calls are good', function(done) {
      try {
        onCallback = function(event, callback) {
          expect(event).to.equal('notification');
          callback();
        };
        this.livenotification
          .of('namespace')
          .subscribe(1234)
          .onNotification(done);
      } catch (e) {
        throw new Error('error');
      }
    });

    it('should fail if trying to chain after unsubscribe', function() {
      try {
        this.livenotification
          .of('namespace')
          .unsubscribe(1234)
          .onNotification(1234);
      } catch (e) {
        return;
      }
      throw new Error('error');
    });

    it('should fail if trying to chain after onNotification', function() {
      try {
        this.livenotification
          .of('namespace')
          .onNotification(1234)
          .subscribe(1234);
      } catch (e) {
        return;
      }
      throw new Error('error');
    });

    it('should emit in \'subscribe\' when subscribing', function(done) {
      emitCallback = function(event, data) {
        expect(event).to.equal('subscribe');
        expect(data).to.equal(1234);
        done();
      };
      this.livenotification
        .of('namespace')
        .subscribe(1234);
    });

    it('should \'unsubscribe\' when unsubscribing', function(done) {
      emitCallback = function(event, data) {
        expect(event).to.equal('unsubscribe');
        expect(data).to.equal(1234);
        done();
      };
      this.livenotification
        .of('namespace')
        .unsubscribe(1234);
    });
  });
});
