'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The messages module', function() {

  describe('POST /api/messages', function() {
    var validReq;

    before(function () {
      validReq = {
        user: {
          emails: ['aEmail'],
          _id: 123
        },
        body: {
          'object': {
            'objectType': 'whatsup',
            'description': 'whatsup message content'
          },
          'targets': [
            {
              'objectType': 'activitystream',
              'id': 'urn:linagora:esn:activitystream:<activitystream uuid>'
            }
          ]
        }
      };
    });

    it('should return 500 if the user is not set in the request', function (done) {
      var res = {
        send: function (code, message) {
          expect(code).to.equal(500);
          expect(message.error.details).to.contain('User');
          done();
        }
      };

      var messageModuleMocked = {};
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createMessage({}, res);
    });

    it('should return 400 if the message is not in the body', function (done) {
      var req = {
        user: {
          emails: ['aEmail']
        }
      }
      var res = {
        send: function (code, message) {
          expect(code).to.equal(400);
          expect(message).to.contain('Missing');
          done();
        }
      };

      var messageModuleMocked = {};
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createMessage(req, res);
    });

    it('should return 500 if it cannot save the message in the database', function (done) {
      var res = {
        send: function (code, message) {
          expect(code).to.equal(500);
          expect(message.error.details).to.contain('Cannot');
          done();
        }
      }

      var messageModuleMocked = {
        save: function (message, callback) {
          callback(new Error('an error has occured'));
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createMessage(validReq, res);
    });

    it('should return 201 and the id of the newly created message', function (done) {
      var res = {
        send: function (code, message) {
          expect(code).to.equal(201);
          expect(message._id).to.equal('a new id');
          done();
        }
      };

      var messageModuleMocked = {
        save: function (message, callback) {
          callback(null, {_id: 'a new id'});
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createMessage(validReq, res);
    });

    it('should publish into "message:activity" on success', function(done) {
      var topicUsed = '';
      var dataPublished = '';

      var res = {
        send: function() {
          expect(topicUsed).to.equal('message:activity');
          expect(dataPublished.source).to.deep.equal({ type: 'user', resource: 123 });
          expect(dataPublished.targets).to.deep.equal([
            {
              'objectType': 'activitystream',
              'id': 'urn:linagora:esn:activitystream:<activitystream uuid>'
            }
          ]);
          expect(dataPublished.message).to.deep.equal({_id: 'a new id', message: 123 });
          expect(dataPublished.date).to.exist;
          expect(dataPublished.verb).to.equal('post');
          done();
        }
      };

      var messageModuleMocked = {
        save: function(message, callback) {
          callback(null, {_id: 'a new id', message: 123 });
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var pubsubMocked = {
        local: {
          topic: function(topic) {
            return {
              publish: function(data) {
                topicUsed = topic;
                dataPublished = data;
              }
            };
          }
        }
      };
      mockery.registerMock('../../core/pubsub', pubsubMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createMessage(validReq, res);
    });

    it('should return 404 otherwise', function (done) {
      var res = {
        send: function (code) {
          expect(code).to.equal(404);
          done();
        }
      }

      var messageModuleMocked = {
        save: function (message, callback) {
          callback(null, false);
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createMessage(validReq, res);
    });
  });

  describe('GET /api/messages', function() {
    var validReq;

    before(function () {
      validReq = {
        user: {
          emails: ['aEmail']
        },
        query: {
          'ids': ['1', '2']
        }
      };
    });

    it('should return 500 if the user is not set in the request', function (done) {
      var res = {
        send: function (code, message) {
          expect(code).to.equal(500);
          expect(message.error.details).to.contain('User');
          done();
        }
      };

      var messageModuleMocked = {};
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.getMessages({}, res);
    });

    it('should return 400 if the ids is not in the query', function (done) {
      var req = {
        user: {
          emails: ['aEmail']
        }
      }
      var res = {
        send: function (code, message) {
          expect(code).to.equal(400);
          expect(message).to.contain('Missing');
          done();
        }
      }

      var messageModuleMocked = {};
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.getMessages(req, res);
    });

    it('should return 500 if it cannot findByIds the messages in the database', function (done) {
      var res = {
        send: function (code, message) {
          expect(code).to.equal(500);
          expect(message.error.details).to.contain('Cannot');
          done();
        }
      };

      var messageModuleMocked = {
        findByIds: function (ids, callback) {
          callback(new Error('an error has occured'));
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.getMessages(validReq, res);
    });

    it('should return 200 and the messages found by ids', function (done) {
      var res = {
        send: function (code, message) {
          expect(code).to.equal(200);
          expect(message).to.deep.equal(['message1', 'message2']);
          done();
        }
      }

      var messageModuleMocked = {
        findByIds: function (ids, callback) {
          expect(ids).to.deep.equal(['1', '2']);
          callback(null, ['message1', 'message2']);
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.getMessages(validReq, res);
    });

    it('should return 404 otherwise', function (done) {
      var res = {
        send: function (code) {
          expect(code).to.equal(404);
          done();
        }
      }

      var messageModuleMocked = {
        findByIds: function (ids, callback) {
          callback(null, []);
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.getMessages(validReq, res);
    });
  });
});
