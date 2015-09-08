'use strict';

var expect = require('chai').expect;

describe('The graceperiod WS events module', function() {

  describe('init function', function() {

    beforeEach(function(done) {
      this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.graceperiod/backend';
      this.pubsub_callback = {};
      var self = this;

      this.pubsub = {
        local: {
          topic: function(topic) {
            return {
              subscribe: function(callback) {
                self.pubsub_callback[topic] = callback;
              }
            };
          }
        }
      };

      this.socketListeners = {};
      this.io = {
        of: function() {
          var socket = {
            on: function(event, callback) {
              self.socketListeners[event] = callback;
            }
          };
          return {
            on: function(event, callback) {
              return callback(socket);
            }
          };
        }
      };
      this.logger = {
        debug: function() {},
        warn: function() {},
        info: function() {},
        error: function() {}
      };
      this.helper = {
        getUserSocketsFromNamespace: function() {},
        getUserId: function() {return '123';}
      };

      this.userModule = {};
      this.moduleHelpers.addDep('logger', self.logger);
      this.moduleHelpers.addDep('wsserver', {io: self.io, ioHelper: self.helper});
      this.moduleHelpers.addDep('pubsub', self.pubsub);
      this.moduleHelpers.addDep('user', self.userModule);

      this.lib = {
        constants: {
          GRACEPERIOD_ERROR: 'graceperiod:error',
          GRACEPERIOD_DONE: 'graceperiod:done'
        }
      };

      done();
    });

    it('should register pubsub subscriber for graceperiod:done event', function() {
      var mod = require(this.moduleHelpers.backendPath + '/ws/graceperiod');
      mod.init(this.lib, this.moduleHelpers.dependencies);
      expect(this.pubsub_callback[this.lib.constants.GRACEPERIOD_DONE]).to.be.a('function');
    });

    it('should register pubsub subscriber for graceperiod:error event', function() {
      var mod = require(this.moduleHelpers.backendPath + '/ws/graceperiod');
      mod.init(this.lib, this.moduleHelpers.dependencies);
      expect(this.pubsub_callback[this.lib.constants.GRACEPERIOD_ERROR]).to.be.a('function');
    });

    describe('graceperiod:error subscriber', function() {

      beforeEach(function() {
        var mod = require(this.moduleHelpers.backendPath + '/ws/graceperiod');
        mod.init(this.lib, this.moduleHelpers.dependencies);
      });

      it('should publish the message from the pubsub into websocket', function(done) {
        var user = '123';
        var self = this;
        var eventData = {id: 'foo', user: user};

        this.helper.getUserSocketsFromNamespace = function(userId) {
          expect(userId).to.equal(user);
          var socket = {
            emit: function(event, data) {
              expect(event).to.equal(self.lib.constants.GRACEPERIOD_ERROR);
              expect(data).to.deep.equal(eventData);
              done();
            }
          };
          return [socket];
        };

        this.pubsub_callback[this.lib.constants.GRACEPERIOD_ERROR](eventData);
      });

      it('should not publish the message when user is not defined', function(done) {
        var eventData = {id: 'foo'};

        this.helper.getUserSocketsFromNamespace = function() {
          return done(new Error());
        };

        this.pubsub_callback[this.lib.constants.GRACEPERIOD_ERROR](eventData);
        done();
      });
    });

    describe('graceperiod:done subscriber', function() {

      beforeEach(function() {
        var mod = require(this.moduleHelpers.backendPath + '/ws/graceperiod');
        mod.init(this.lib, this.moduleHelpers.dependencies);
      });

      it('should publish the message from the pubsub into websocket', function(done) {
        var user = '123';
        var self = this;
        var eventData = {id: 'foo', user: user};

        this.helper.getUserSocketsFromNamespace = function(userId) {
          expect(userId).to.equal(user);
          var socket = {
            emit: function(event, data) {
              expect(event).to.equal(self.lib.constants.GRACEPERIOD_DONE);
              expect(data).to.deep.equal(eventData);
              done();
            }
          };
          return [socket];
        };

        this.pubsub_callback[this.lib.constants.GRACEPERIOD_DONE](eventData);
      });

      it('should not publish the message when user is not defined', function(done) {
        var eventData = {id: 'foo'};

        this.helper.getUserSocketsFromNamespace = function() {
          return done(new Error());
        };

        this.pubsub_callback[this.lib.constants.GRACEPERIOD_DONE](eventData);
        done();
      });
    });
  });
});
