'use strict';

var expect = require('chai').expect;
var CONTACT_ADDED = 'contacts:contact:add';
var CONTACT_DELETED = 'contacts:contact:delete';

describe('The contact WS events module', function() {

  describe('init function', function() {

    var nbSubscribedTopics;

    beforeEach(function(done) {

      var self = this;

      this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.contact/backend';

      this.pubsub = {
        local: {
          topic: function(topic) {
            return {
              subscribe: function(callback) {
                nbSubscribedTopics++;
                if (topic === CONTACT_ADDED) {
                  self.pubsub_callback_added = callback;
                  self.pubsub_callback_added();
                } else if (topic === CONTACT_DELETED) {
                  self.pubsub_callback_deleted = callback;
                } else {
                  done(new Error('Should not have'));
                }
              },
              publish: function(data) {
                if (topic === CONTACT_ADDED) {
                  self.pubsub_callback_added(data);
                } else if (topic === CONTACT_DELETED) {
                  self.pubsub_callback_deleted(data);
                }
              }
            };
          }
        }
      };

      this.socketListeners = {};
      this.contactNamespace = {
        on: function() {},
        to: function(roomId) {
          return {
            emit: function(event, data) {}
          };
        }
      };

      this.io = {

        of: function(namespace) {
          return self.contactNamespace;
        }
      };

      this.logger = {
        warn: function() {},
        info: function() {},
        error: function() {}
      };

      this.moduleHelpers.addDep('logger', self.logger);
      this.moduleHelpers.addDep('wsserver', {io: self.io});
      this.moduleHelpers.addDep('pubsub', self.pubsub);

      done();
    });


    it('should register pubsub subscriber for contacts:contact:add', function() {
      var mod = require(this.moduleHelpers.backendPath + '/ws/contact');
      mod.init(this.moduleHelpers.dependencies);
      expect(this.pubsub_callback_added).to.be.a('function');
    });

    it('should register pubsub subscriber for contacts:contact:delete', function() {
      var mod = require(this.moduleHelpers.backendPath + '/ws/contact');
      mod.init(this.moduleHelpers.dependencies);
      expect(this.pubsub_callback_deleted).to.be.a('function');
    });

    describe('contacts:contact:add subscriber', function() {
      beforeEach(function() {
        var roomId = '123';
        var dataToSend = {
          bookId: '123',
          contactId: '456',
          vcard: {
            firstname: 'prenom'
          }
        };
        var dataSent = {
          room: roomId,
          data: dataToSend
        };
        var mod = require(this.moduleHelpers.backendPath + '/ws/contact');
        this.contactNamespace = {
          on: function() {},
          to: function(roomId) {
            return {
              emit: function(event, data, roomId) {
                expect(event).to.equal('contact:created');
                expect(roomId).to.equal(data.bookId);
                expect(data).to.deep.equals(dataSent);
              }
            };
          }
        };
        mod.init(this.moduleHelpers.dependencies);
      });

      it('should send create event with contact info in websockets when receiving contacts:contact:add event from the pubsub', function(done) {
        var dataToSend = {
          bookId: '123',
          contactId: '456',
          vcard: {
            firstname: 'prenom'
          }
        };
        this.pubsub.local.topic(CONTACT_ADDED).publish(dataToSend);
        done();
      });
    });
    describe('contacts:contact:delete subscriber', function() {
      beforeEach(function() {
        var roomId = '123';
        var dataToSend = {
          bookId: '123',
          contactId: '456',
          vcard: {
            firstname: 'prenom'
          }
        };
        var dataSent = {
          room: roomId,
          data: dataToSend
        };
        var mod = require(this.moduleHelpers.backendPath + '/ws/contact');
        this.contactNamespace = {
          on: function() {},
          to: function(roomId) {
            return {
              emit: function(event, data, roomId) {
                expect(event).to.equal('contact:deleted');
                expect(roomId).to.equal(data.bookId);
                expect(data).to.deep.equals(dataSent);
              }
            };
          }
        };
        mod.init(this.moduleHelpers.dependencies);
      });

      it('should send delete event with contact info in websockets when receiving contacts:contact:delete event from the pubsub', function(done) {
        var dataToSend = {
          bookId: '123',
          contactId: '456',
          vcard: {
            firstname: 'prenom'
          }
        };
        this.pubsub.local.topic(CONTACT_DELETED).publish(dataToSend);
        done();
      });
    });
  });
});
