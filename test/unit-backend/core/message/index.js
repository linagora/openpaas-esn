'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The core messages module', function() {

  describe('save method', function() {

    it('should not publish in topic message:stored if there was an error', function(done) {
      var mongooseMocked = {
        model: function(model) {
          function Whatsup(message) {
            this.message = message;
          }
          Whatsup.prototype.save = function(callback) {
            return callback(new Error('There was an error !'));
          };
          return Whatsup;
        }
      };
      mockery.registerMock('mongoose', mongooseMocked);

      var pubsubMocked = {
        local: {
          topic: function(topic) {
            return {
              publish: function(response) {
                throw new Error('There is an error !');
              }
            };
          }
        }
      };
      mockery.registerMock('../pubsub', pubsubMocked);

      function callback(err, response) {
        expect(err).to.exist;
        done();
      }

      require(this.testEnv.basePath + '/backend/core/message').save({}, callback);
    });

    it('should publish in topic message:stored if there is no error', function(done) {
      var mongooseMocked = {
        model: function(model) {
          function Whatsup(message) {
            this.message = message;
          }
          Whatsup.prototype.save = function(callback) {
            return callback(null, {_id: ''});
          };
          return Whatsup;
        }
      };
      mockery.registerMock('mongoose', mongooseMocked);

      var topicUsed = '';
      var pubsubMocked = {
        local: {
          topic: function(topic) {
            return {
              publish: function(response) {
                topicUsed = topic;
              }
            };
          }
        }
      };
      mockery.registerMock('../pubsub', pubsubMocked);

      function callback(err, response) {
        expect(err).not.to.exist;
        expect(topicUsed).to.equal('message:stored');
        done();
      }

      require(this.testEnv.basePath + '/backend/core/message').save({}, callback);
    });

  });

  describe('addNewComment method', function() {

    it('should not publish in topic message:comment if there was an error', function(done) {
      var mongooseMocked = {
        model: function(model) {
          function Whatsup(message) {
            this.message = message;
          }
          Whatsup.findByIdAndUpdate = function(id, update, callback) {
            return callback(new Error('There was an error !'));
          };
          return Whatsup;
        }
      };
      mockery.registerMock('mongoose', mongooseMocked);

      var pubsubMocked = {
        local: {
          topic: function(topic) {
            return {
              publish: function(response) {
                throw new Error('There is an error !');
              }
            };
          }
        }
      };
      mockery.registerMock('../pubsub', pubsubMocked);

      function callback(err, response) {
        expect(err).to.exist;
        done();
      }

      require(this.testEnv.basePath + '/backend/core/message').addNewComment({}, {}, callback);
    });

    it('should publish in topic message:comment (adding inReplyTo) if there is no error', function(done) {
      var mongooseMocked = {
        model: function(model) {
          function Whatsup(message) {
            this.message = message;
          }
          Whatsup.findByIdAndUpdate = function(id, update, callback) {
            return callback();
          };
          return Whatsup;
        }
      };
      mockery.registerMock('mongoose', mongooseMocked);

      var topicUsed = '';
      var message = {};
      var pubsubMocked = {
        local: {
          topic: function(topic) {
            return {
              publish: function(response) {
                topicUsed = topic;
                message = response;
              }
            };
          }
        }
      };
      mockery.registerMock('../pubsub', pubsubMocked);

      function callback(err) {
        expect(err).not.to.exist;
        expect(topicUsed).to.equal('message:comment');
        expect(message.inReplyTo).to.deep.equal({ id: 'replied' });
        done();
      }

      require(this.testEnv.basePath + '/backend/core/message').addNewComment({}, { id: 'replied' }, callback);
    });

    it('should remove targets from the comment before adding it to the message', function(done) {
      var message = {};
      var mongooseMocked = {
        model: function(model) {
          function Whatsup(message) {
            this.content = message.content;
            this.targets = message.targets;
          }
          Whatsup.findByIdAndUpdate = function(id, update, callback) {
            message = update.$push.responses;
            return callback(null, {_id: 'a parent id'});
          };
          return Whatsup;
        }
      };
      mockery.registerMock('mongoose', mongooseMocked);

      var pubsubMocked = {
        local: {
          topic: function() {
            return {
              publish: function() {
              }
            };
          }
        }
      };
      mockery.registerMock('../pubsub', pubsubMocked);

      function callback(err, comment, parent) {
        expect(err).not.to.exist;
        expect(message.content).to.equal('a content');
        expect(message.targets).not.to.exist;
        expect(parent._id).to.equal('a parent id');
        expect(comment).to.deep.equal(message);
        done();
      }

      require(this.testEnv.basePath + '/backend/core/message').addNewComment({content: 'a content', targets: 'some targets'}, { id: 'replied' }, callback);
    });
  });

});
