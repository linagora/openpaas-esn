'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The calendar WS events module', function() {

  describe('init function', function() {

    beforeEach(function(done) {
      this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar/backend';
      var TOPIC = 'calendar:event:updated';
      var self = this;
      this.pubsub = {
        global: {
          topic: function(topic) {
            return {
              subscribe: function(callback) {
                if (topic === TOPIC) {
                  self.pubsub_callback = callback;
                } else {
                  done(new Error('Should not have'));
                }
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
        warn: function() {},
        info: function() {},
        error: function() {}
      };
      this.helper = {
        getUserSocketsFromNamespace: function() {}
      };
      this.userModule = {};
      this.moduleHelpers.addDep('logger', self.logger);
      this.moduleHelpers.addDep('wsserver', {io: self.io, ioHelper: self.helper});
      this.moduleHelpers.addDep('pubsub', self.pubsub);
      this.moduleHelpers.addDep('user', self.userModule);

      done();
    });

    it('should register pubsub subscriber for calendar:event:updated event', function() {
      var mod = require(this.moduleHelpers.backendPath + '/ws/calendar');
      mod.init(this.moduleHelpers.dependencies);
      expect(this.pubsub_callback).to.be.a('function');
    });

    describe('calendar:event:updated subscriber', function() {

      beforeEach(function() {
        var mod = require(this.moduleHelpers.backendPath + '/ws/calendar');
        mod.init(this.moduleHelpers.dependencies);
      });

      it('should return the message from the pubsub', function(done) {
        this.helper.getUserSocketsFromNamespace = function(userId) {
          expect(userId).to.equal('123');
          var socket = {
            emit: function(event, ics) {
              expect(event).to.equal('event:updated');
              expect(ics).to.equal('ICS');
              done();
            }
          };
          return [socket];
        };

        this.pubsub_callback({
          target: {
            _id: '123'
          },
          event: 'ICS'
        });
      });
    });

    it('should register a listener to the websocket "event:updated" event', function() {
      var mod = require(this.moduleHelpers.backendPath + '/ws/calendar');
      mod.init(this.moduleHelpers.dependencies);
      expect(this.socketListeners['event:updated']).to.exist;
    });

    describe('event:updated websocket listnerer', function() {

      it('should publish to the global pubsub for each existing mail in the received jcal object', function(done) {
        var inputData = 'jcal';
        var emails = ['johndoe@lost.com', 'janedoe@lost.com'];
        var johnDoe = {_id: 'johndoe'};

        mockery.registerMock('../lib/jcal/jcalHelper', {
          getAttendeesEmails: function(jcal) {
            expect(jcal).to.deep.equal(inputData);
            return emails;
          }
        });

        this.userModule.findByEmail = function(email, callback) {
          if (email === emails[0]) {
            return callback(null, johnDoe);
          } else if (email === emails[1]) {
            return callback(new Error('User not found'));
          } else {
            done(new Error('Should not have searched for this user'));
          }
        };

        this.pubsub.local = {
          topic: function(event) {
            expect(event).to.equal('calendar:event:updated');
            return {
              forward: function(global, data) {
                expect(data).to.deep.equal({
                  target: johnDoe,
                  event: inputData
                });
              }
            };
          }
        };

        var mod = require(this.moduleHelpers.backendPath + '/ws/calendar');
        mod.init(this.moduleHelpers.dependencies);
        this.socketListeners['event:updated'](inputData);
        done();
      });

    });

  });
});
