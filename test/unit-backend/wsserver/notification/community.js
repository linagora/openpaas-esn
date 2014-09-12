'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The community notification WS module', function() {

  describe('init function', function() {
    beforeEach(function() {
      var JOIN_TOPIC = 'community:join';
      var LEAVE_TOPIC = 'community:leave';
      var self = this;
      this.pubsub = {
        topic: function(topic) {
          return {
            subscribe: function(callback) {
              if (topic === JOIN_TOPIC) {
                self.join_callback = callback;
              } else if (topic === LEAVE_TOPIC) {
                self.leave_callback = callback;
              }
            }
          };
        }
      };
      this.io = {
        of: function() {
          return {
            on: function() {}
          };
        }
      };
      this.logger = require(this.testEnv.fixtures + '/logger-noop');
      this.core = {
        logger: this.logger,
        pubsub: {
          global: this.pubsub
        }
      };
      mockery.registerMock('../../core', this.core);
    });

    it('should register pubsub subscriber for community:join event', function() {
      var mod = require(this.testEnv.basePath + '/backend/wsserver/notification/community');
      mod.init(this.io);
      expect(this.join_callback).to.be.a('function');
    });

    it('should register pubsub subscriber for community:leave event', function() {
      var mod = require(this.testEnv.basePath + '/backend/wsserver/notification/community');
      mod.init(this.io);
      expect(this.leave_callback).to.be.a('function');
    });

    describe('community:join subscriber', function() {
      beforeEach(function() {
        var mod = require(this.testEnv.basePath + '/backend/wsserver/notification/community');
        mod.init(this.io);
      });
      it('should return the message from the pubsub', function(done) {
        this.io.of = function() {
          return {
            to: function() {
              return {
                emit: function(evt, msg) {
                  expect(evt).to.equal('join');
                  expect(msg.room).to.equal('9876');
                  expect(msg.data.author).to.equal('1234');
                  expect(msg.data.target).to.equal('5678');
                  expect(msg.data.community).to.equal('9876');
                  done();
                }
              };
            }
          };
        };
        this.join_callback({
          author: '1234',
          target: '5678',
          community: '9876'
        });
      });
    });
    describe('community:leave subscriber', function() {
      beforeEach(function() {
        var mod = require(this.testEnv.basePath + '/backend/wsserver/notification/community');
        mod.init(this.io);
      });
      it('should return the message from the pubsub', function(done) {
        this.io.of = function() {
          return {
            to: function() {
              return {
                emit: function(evt, msg) {
                  expect(evt).to.equal('leave');
                  expect(msg.room).to.equal('9876');
                  expect(msg.data.author).to.equal('1234');
                  expect(msg.data.target).to.equal('5678');
                  expect(msg.data.community).to.equal('9876');
                  done();
                }
              };
            }
          };
        };
        this.leave_callback({
          author: '1234',
          target: '5678',
          community: '9876'
        });
      });
    });
  });
});
