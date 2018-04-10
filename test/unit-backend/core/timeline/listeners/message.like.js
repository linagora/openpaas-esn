'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The message.like timeline listener', function() {

  describe('The handler function', function() {

    it('should fail if userModule.get fails', function(done) {
      var link = {
        source: {
        },
        target: {
        },
        timestamps: {
          creation: Date.now()
        }
      };

      mockery.registerMock('../../user', {
        get: function(id, callback) {
          return callback(new Error('Fail to get user'));
        }
      });

      mockery.registerMock('../../message', {
        findByIds: function(id, callback) {
          return callback(null, [{}]);
        }
      });

      var module = this.helpers.requireBackend('core/timeline/listeners/message.like');
      module.handler(link).then(done, function(err) {
        expect(err.message).to.equals('Fail to get user');
        done();
      });
    });

    it('should fail if messageModule.findByIds fails', function(done) {
      var link = {
        source: {
        },
        target: {
        },
        timestamps: {
          creation: Date.now()
        }
      };

      mockery.registerMock('../../user', {
        get: function(id, callback) {
          return callback(null, {});
        }
      });

      mockery.registerMock('../../message', {
        findByIds: function(id, callback) {
          return callback(new Error('Fail to get message'));
        }
      });

      var module = this.helpers.requireBackend('core/timeline/listeners/message.like');
      module.handler(link).then(done, function(err) {
        expect(err.message).to.equals('Fail to get message');
        done();
      });

    });

    it('should return a timelineentry from the link source and target', function(done) {
      var userId = 1;
      var authorId = 2;
      var messageId = 3;
      var user = {
        _id: userId,
        firstname: 'first',
        lastname: 'last'
      };
      var message = {
        _id: messageId,
        objectType: 'whatsup',
        author: authorId
      };
      var link = {
        source: {
          id: userId
        },
        target: {
          id: messageId
        },
        timestamps: {
          creation: Date.now()
        }
      };

      mockery.registerMock('../../user', {
        get: function(id, callback) {
          expect(id).to.equal(link.source.id);
          return callback(null, user);
        }
      });

      mockery.registerMock('../../message', {
        findByIds: function(ids, callback) {
          expect(ids).to.deep.equal([link.target.id]);
          return callback(null, [message]);
        }
      });

      var module = this.helpers.requireBackend('core/timeline/listeners/message.like');
      module.handler(link).then(function(result) {
        expect(result).to.shallowDeepEqual({
          verb: 'like',
          published: link.timestamps.creation,
          actor: {
            _id: userId
          },
          object: {
            objectType: message.objectType,
            _id: message._id
          },
          target: [{
            objectType: 'user',
            _id: String(message.author._id)
          }]
        });
        done();
      }, done);
    });
  });
});
