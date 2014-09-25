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

      require(this.testEnv.basePath + '/backend/core/message/whatsup').save({}, callback);
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

      require(this.testEnv.basePath + '/backend/core/message/whatsup').save({}, callback);
    });

  });
});
