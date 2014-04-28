'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The messages module', function() {
  var validReq;

  before(function() {
    validReq = {
      user: {
        emails: ['aEmail']
      },
      body: {
        'object': {
          'objectType': 'whatsup',
          'description': 'whatsup message content'
        },
        'targets': [
          {
            'objectType': 'wall',
            'id': 'urn:linagora:esn:wall:<wall uuid>'
          }
        ]
      }
    };
  });

  it('should return 500 if the user is not set in the request', function(done) {
    var res = {
      send: function(code, message) {
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

  it('should return 400 if the message is not in the body', function(done) {
    var req = {
      user: {
        emails: ['aEmail']
      }
    };
    var res = {
      send: function(code, message) {
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

  it('should return 500 if it cannot save the message in the database', function(done) {
    var res = {
      send: function(code, message) {
        expect(code).to.equal(500);
        expect(message.error.details).to.contain('Cannot');
        done();
      }
    };

    var messageModuleMocked = {
      save: function(message, callback) {
        callback(new Error('an error has occured'));
      }
    };
    mockery.registerMock('../../core/message', messageModuleMocked);

    var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
    messages.createMessage(validReq, res);
  });

  it('should return 201 and the id of the newly created message', function(done) {
    var res = {
      send: function(code, message) {
        expect(code).to.equal(201);
        expect(message._id).to.equal('a new id');
        done();
      }
    };

    var messageModuleMocked = {
      save: function(message, callback) {
        callback(null, {_id: 'a new id'});
      }
    };
    mockery.registerMock('../../core/message', messageModuleMocked);

    var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
    messages.createMessage(validReq, res);
  });

  it('should return 404 otherwise', function(done) {
    var res = {
      send: function(code) {
        expect(code).to.equal(404);
        done();
      }
    };

    var messageModuleMocked = {
      save: function(message, callback) {
        callback(null, false);
      }
    };
    mockery.registerMock('../../core/message', messageModuleMocked);

    var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
    messages.createMessage(validReq, res);
  });

});
