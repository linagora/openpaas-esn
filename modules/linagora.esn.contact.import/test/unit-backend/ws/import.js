'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');

describe('The import WS event module', function() {

  describe('The init fn', function() {

    var IMPORT_ACCOUNT_ERROR, IMPORT_API_CLIENT_ERROR, IMPORT_CONTACT_CLIENT_ERROR;
    var NAMESPACE = '/contact-import';

    beforeEach(function() {
      var self = this;
      self.moduleHelpers.backendPath = self.moduleHelpers.modulesPath + 'linagora.esn.contact.import/backend';

      self.logger = {
        warn: function() {},
        info: function() {},
        error: function() {},
        debug: function() {}
      };

      self.importNamespace = {
        on: function() {},
        to: function(roomId) {
          return {
            emit: function(event, data) {}
          };
        }
      };

      self.io = {
        of: function(namespace) {
          return self.importNamespace;
        }
      };

      self.pubsub = {
        global: {
          topic: function() {
            return {
              subscribe: function() {},
              publish: function() {}
            };
          }
        }
      };

      self.moduleHelpers.addDep('logger', self.logger);
      self.moduleHelpers.addDep('wsserver', { io: self.io });
      self.moduleHelpers.addDep('pubsub', self.pubsub);

      var CONTACT_IMPORT_ERROR = require(self.moduleHelpers.backendPath + '/constants').CONTACT_IMPORT_ERROR;

      IMPORT_ACCOUNT_ERROR = CONTACT_IMPORT_ERROR.ACCOUNT_ERROR;
      IMPORT_API_CLIENT_ERROR = CONTACT_IMPORT_ERROR.API_CLIENT_ERROR;
      IMPORT_CONTACT_CLIENT_ERROR = CONTACT_IMPORT_ERROR.CONTACT_CLIENT_ERROR;
    });

    function initModule(self) {
      var mod = require(self.moduleHelpers.backendPath + '/ws/import');
      mod.init(self.moduleHelpers.dependencies);
    }

    it('should subscrite error topics', function() {
      var topicSpy = sinon.spy(function() {
        return {
          subscribe: function() {}
        };
      });
      this.pubsub.global.topic = topicSpy;
      initModule(this);
      expect(topicSpy.callCount).to.equal(3);
      expect(topicSpy.withArgs(IMPORT_ACCOUNT_ERROR).calledOnce).to.be.true;
      expect(topicSpy.withArgs(IMPORT_API_CLIENT_ERROR).calledOnce).to.be.true;
      expect(topicSpy.withArgs(IMPORT_CONTACT_CLIENT_ERROR).calledOnce).to.be.true;
    });

    it('should create socket namespace with the right parameters', function(done) {
      this.io.of = function(namespace) {
        expect(namespace).to.equal(NAMESPACE);
        done();
        return {
          on: function() {}
        };
      };
      initModule(this);
    });

    describe('Notify socket events', function() {

      beforeEach(function() {
        this.user = { _id: 123 };
      });

      it('should notify IMPORT_ACCOUNT_ERROR event to connected sockets in the same room', function(done) {
        var callback;
        var user = this.user;
        var provider = 'a provider';
        var account = 'an account';

        this.pubsub.global.topic = function(topic) {
          return {
            subscribe: function(cb) {
              if (topic === IMPORT_ACCOUNT_ERROR) {
                callback = cb;
              }
            },
            publish: function(data) {
              if (callback) {
                callback(data);
              }
            }
          };
        };

        this.importNamespace.to = function(roomId) {
          expect(roomId).to.equal(user._id + '');
          return {
            emit: function(eventName, data) {
              expect(eventName).to.equal(IMPORT_ACCOUNT_ERROR);
              expect(data.room).to.equal(roomId);
              expect(data.data.account).to.equal(account);
              expect(data.data.provider).to.equal(provider);
              done();
            }
          };
        };
        initModule(this);
        this.pubsub.global.topic(IMPORT_ACCOUNT_ERROR).publish({
          user: user,
          account: account,
          provider: provider
        });
      });

      it('should notify IMPORT_API_CLIENT_ERROR event to connected sockets in the same room', function(done) {
        var callback;
        var user = this.user;
        var provider = 'a provider';
        var account = 'an account';

        this.pubsub.global.topic = function(topic) {
          return {
            subscribe: function(cb) {
              if (topic === IMPORT_API_CLIENT_ERROR) {
                callback = cb;
              }
            },
            publish: function(data) {
              if (callback) {
                callback(data);
              }
            }
          };
        };

        this.importNamespace.to = function(roomId) {
          expect(roomId).to.equal(user._id + '');
          return {
            emit: function(eventName, data) {
              expect(eventName).to.equal(IMPORT_API_CLIENT_ERROR);
              expect(data.room).to.equal(roomId);
              expect(data.data.account).to.equal(account);
              expect(data.data.provider).to.equal(provider);
              done();
            }
          };
        };
        initModule(this);
        this.pubsub.global.topic(IMPORT_API_CLIENT_ERROR).publish({
          user: user,
          account: account,
          provider: provider
        });
      });

      it('should notify IMPORT_CONTACT_CLIENT_ERROR event to connected sockets in the same room', function(done) {
        var callback;
        var user = this.user;
        var provider = 'a provider';
        var account = 'an account';

        this.pubsub.global.topic = function(topic) {
          return {
            subscribe: function(cb) {
              if (topic === IMPORT_CONTACT_CLIENT_ERROR) {
                callback = cb;
              }
            },
            publish: function(data) {
              if (callback) {
                callback(data);
              }
            }
          };
        };

        this.importNamespace.to = function(roomId) {
          expect(roomId).to.equal(user._id + '');
          return {
            emit: function(eventName, data) {
              expect(eventName).to.equal(IMPORT_CONTACT_CLIENT_ERROR);
              expect(data.room).to.equal(roomId);
              expect(data.data.account).to.equal(account);
              expect(data.data.provider).to.equal(provider);
              done();
            }
          };
        };
        initModule(this);
        this.pubsub.global.topic(IMPORT_CONTACT_CLIENT_ERROR).publish({
          user: user,
          account: account,
          provider: provider
        });
      });

    });

  });

});
