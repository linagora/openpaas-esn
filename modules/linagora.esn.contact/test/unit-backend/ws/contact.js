'use strict';

var expect = require('chai').expect;
var CONTACT_ADDED = 'contacts:contact:add';
var CONTACT_DELETED = 'contacts:contact:delete';
var CONTACT_UPDATED = 'contacts:contact:update';

describe('The contact WS events module', function() {

  function nsNotCalled(done) {
    return {
      on: function() {
      },
      to: function() {
        return {
          emit: function() {
            done(new Error('Should not be called'));
          }
        };
      }
    };
  }

  describe('init function', function() {

    var contactNamespace;

    beforeEach(function(done) {

      var self = this;

      this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.contact/backend';

      this.pubsub = {
        local: {
          topic: function(topic) {
            return {
              subscribe: function(callback) {
                if (topic === CONTACT_ADDED) {
                  self.pubsub_callback_added = callback;
                  self.pubsub_callback_added();
                } else if (topic === CONTACT_DELETED) {
                  self.pubsub_callback_deleted = callback;
                } else if (topic === CONTACT_UPDATED) {
                  self.pubsub_callback_updated = callback;
                } else {
                  done(new Error('Should not have'));
                }
              },
              publish: function(data) {
                if (topic === CONTACT_ADDED) {
                  self.pubsub_callback_added(data);
                } else if (topic === CONTACT_DELETED) {
                  self.pubsub_callback_deleted(data);
                } else if (topic === CONTACT_UPDATED) {
                  self.pubsub_callback_updated(data);
                }
              }
            };
          }
        }
      };

      this.socketListeners = {};
      contactNamespace = {
        on: function() {},
        to: function() {
          return {
            emit: function() {}
          };
        }
      };

      this.io = {
        of: function() {
          return contactNamespace;
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

      this.checkData = function(data, topic, done) {
        var mod = require(this.moduleHelpers.backendPath + '/ws/contact');
        contactNamespace = nsNotCalled(done);
        mod.init(this.moduleHelpers.dependencies);
        this.logger.warn = function(message) {
          expect(message).to.match(/Not well-formed data on/);
          return done();
        };
        this.pubsub.local.topic(topic).publish(data);
      };

      this.checkMode = function(data, topic, done) {
        var mod = require(this.moduleHelpers.backendPath + '/ws/contact');
        contactNamespace = nsNotCalled(done);
        mod.init(this.moduleHelpers.dependencies);
        this.logger.info = function(message) {
          expect(message).to.match(/notification is skipped/);
          return done();
        };
        this.pubsub.local.topic(topic).publish(data);
      };

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

    it('should register pubsub subscriber for contacts:contact:update', function() {
      var mod = require(this.moduleHelpers.backendPath + '/ws/contact');
      mod.init(this.moduleHelpers.dependencies);
      expect(this.pubsub_callback_updated).to.be.a('function');
    });

    it('should warning if the pubsub event data is empty', function() {
      var count = 0;
      var mod = require(this.moduleHelpers.backendPath + '/ws/contact');
      mod.init(this.moduleHelpers.dependencies);
      this.logger.warn = function() {
        count++;
      };
      this.pubsub.local.topic(CONTACT_ADDED).publish({});
      this.pubsub.local.topic(CONTACT_DELETED).publish({});
      this.pubsub.local.topic(CONTACT_UPDATED).publish({});
      expect(count).to.equal(3);
    });

    describe('contacts:contact:add subscriber', function() {

      it('should not publish event when data.mode===import', function(done) {
        this.checkMode({mode: 'import'}, CONTACT_ADDED, done);
      });

      it('should not publish event when data is undefined', function(done) {
        this.checkData(null, CONTACT_ADDED, done);
      });

      it('should not publish event when data is empty', function(done) {
        this.checkData({}, CONTACT_ADDED, done);
      });

      it('should not publish event when bookName and vcard are missing', function(done) {
        this.checkData({bookId: '123'}, CONTACT_ADDED, done);
      });

      it('should not publish event when bookId and vcard are missing', function(done) {
        this.checkData({bookName: '123'}, CONTACT_ADDED, done);
      });

      it('should not publish event when vcard is missing', function(done) {
        this.checkData({bookId: '123', bookName: '456'}, CONTACT_ADDED, done);
      });

      it('should not publish event when bookId is missing', function(done) {
        this.checkData({vcard: '123', bookName: '456'}, CONTACT_ADDED, done);
      });

      it('should not publish event when bookName is missing', function(done) {
        this.checkData({vcard: '123', bookId: '456'}, CONTACT_ADDED, done);
      });

      it('should send create event with contact info in websockets when receiving contacts:contact:add event from the pubsub', function(done) {
        var pubsubData = {
          bookId: '123',
          bookName: 'name',
          contactId: '456',
          vcard: {
            firstname: 'prenom'
          }
        };
        var mod = require(this.moduleHelpers.backendPath + '/ws/contact');
        contactNamespace = {
          on: function() {},
          to: function(roomId) {
            return {
              emit: function(event, data) {
                expect(event).to.equal('contact:created');
                expect(roomId).to.equal(pubsubData.bookId);
                expect(data).to.deep.equals({
                  room: pubsubData.bookId,
                  data: { bookId: pubsubData.bookId, bookName: pubsubData.bookName, vcard: pubsubData.vcard }
                });
                done();
              }
            };
          }
        };
        mod.init(this.moduleHelpers.dependencies);

        this.pubsub.local.topic(CONTACT_ADDED).publish(pubsubData);
      });
    });

    describe('contacts:contact:delete subscriber', function() {

      it('should not publish event when data.mode===import', function(done) {
        this.checkMode({mode: 'import'}, CONTACT_DELETED, done);
      });

      it('should not publish event when data is undefined', function(done) {
        this.checkData(null, CONTACT_DELETED, done);
      });

      it('should not publish event when data is empty', function(done) {
        this.checkData({}, CONTACT_DELETED, done);
      });

      it('should not publish event when bookName and contactId are missing', function(done) {
        this.checkData({bookId: '123'}, CONTACT_DELETED, done);
      });

      it('should not publish event when bookId and contactId are missing', function(done) {
        this.checkData({bookName: '123'}, CONTACT_DELETED, done);
      });

      it('should not publish event when contactId is missing', function(done) {
        this.checkData({bookId: '123', bookName: '456'}, CONTACT_DELETED, done);
      });

      it('should not publish event when bookId is missing', function(done) {
        this.checkData({contactId: '123', bookName: '456'}, CONTACT_DELETED, done);
      });

      it('should not publish event when bookName is missing', function(done) {
        this.checkData({contactId: '123', bookId: '456'}, CONTACT_DELETED, done);
      });

      it('should send delete event with contact info in websockets when receiving contacts:contact:delete event from the pubsub', function(done) {
        var pubsubData = {
          bookId: '123',
          bookName: 'name',
          contactId: '456'
        };
        var mod = require(this.moduleHelpers.backendPath + '/ws/contact');
        contactNamespace = {
          on: function() {},
          to: function(roomId) {
            return {
              emit: function(event, data) {
                expect(event).to.equal('contact:deleted');
                expect(roomId).to.equal(pubsubData.bookId);
                expect(data).to.deep.equals({
                  room: pubsubData.bookId,
                  data: { bookId: pubsubData.bookId, bookName: pubsubData.bookName, contactId: pubsubData.contactId }
                });
                done();
              }
            };
          }
        };
        mod.init(this.moduleHelpers.dependencies);

        this.pubsub.local.topic(CONTACT_DELETED).publish(pubsubData);
      });
    });

    describe('contacts:contact:update subscriber', function() {

      it('should not publish event when data.mode===import', function(done) {
        this.checkMode({mode: 'import'}, CONTACT_UPDATED, done);
      });

      it('should not publish event when data is undefined', function(done) {
        this.checkData(null, CONTACT_UPDATED, done);
      });

      it('should not publish event when data is empty', function(done) {
        this.checkData({}, CONTACT_UPDATED, done);
      });

      it('should not publish event when bookName and contactId are missing', function(done) {
        this.checkData({bookId: '123'}, CONTACT_UPDATED, done);
      });

      it('should not publish event when bookId and contactId are missing', function(done) {
        this.checkData({bookName: '123'}, CONTACT_UPDATED, done);
      });

      it('should not publish event when contactId is missing', function(done) {
        this.checkData({bookId: '123', bookName: '456'}, CONTACT_UPDATED, done);
      });

      it('should not publish event when bookId is missing', function(done) {
        this.checkData({contactId: '123', bookName: '456'}, CONTACT_UPDATED, done);
      });

      it('should not publish event when bookName is missing', function(done) {
        this.checkData({contactId: '123', bookId: '456'}, CONTACT_UPDATED, done);
      });

      it('should send update event with contact info in websockets when receiving contacts:contact:update event from the pubsub', function(done) {
        var pubsubData = {
          bookId: '123',
          bookName: 'name',
          contactId: '456'
        };
        var mod = require(this.moduleHelpers.backendPath + '/ws/contact');
        contactNamespace = {
          on: function() {},
          to: function(roomId) {
            return {
              emit: function(event, data) {
                expect(event).to.equal('contact:updated');
                expect(roomId).to.equal(pubsubData.bookId);
                expect(data).to.deep.equals({
                  room: pubsubData.bookId,
                  data: { bookId: pubsubData.bookId, bookName: pubsubData.bookName, contactId: pubsubData.contactId }
                });
                done();
              }
            };
          }
        };
        mod.init(this.moduleHelpers.dependencies);

        this.pubsub.local.topic(CONTACT_UPDATED).publish(pubsubData);
      });
    });

  });
});
