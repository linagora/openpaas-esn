'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The user.follow timeline denormalizer', function() {

  describe('The handler function', function() {

    it('should not update the entry if userModule.get fails', function(done) {
      var entry = {
        target: [
          {
            objectType: 'user',
            _id: 1
          }
        ]
      };

      mockery.registerMock('../../user', {
        get: function(id, callback) {
          return callback(new Error('Fail to get user'));
        }
      });

      var module = this.helpers.requireBackend('core/timeline/denormalizers/user.follow')();
      module.handler(entry).then(function(result) {
        expect(result).to.deep.equal(entry);
        done();
      }, done);
    });

    it('should not update the entry if userModule.get does not return any user', function(done) {
      var entry = {
        target: [
          {
            objectType: 'user',
            _id: 1
          }
        ]
      };

      mockery.registerMock('../../user', {
        get: function(id, callback) {
          return callback();
        }
      });

      var module = this.helpers.requireBackend('core/timeline/denormalizers/user.follow')();
      module.handler(entry).then(function(result) {
        expect(result).to.deep.equal(entry);
        done();
      }, done);
    });

    it('should not update the entry target objectType is not a user', function(done) {
      var entry = {
        target: [
          {
            _id: 1,
            objectType: 'foo'
          }
        ]
      };

      mockery.registerMock('../../user', {
        get: function() {
          done(new Error('Should not be called'));
        }
      });

      var module = this.helpers.requireBackend('core/timeline/denormalizers/user.follow')();
      module.handler(entry).then(function(result) {
        expect(result).to.deep.equal(entry);
        done();
      }, done);
    });

    it('should populate target from user info', function(done) {
      var user = {
        objectType: 'user',
        _id: 1,
        currentAvatar: 2,
        firstname: 'John',
        lastname: 'Doe'
      };

      var entry = {
        target: [
          {
            objectType: 'user',
            _id: 1
          }
        ]
      };

      mockery.registerMock('../../user', {
        get: function(id, callback) {
          return callback(null, user);
        }
      });

      var module = this.helpers.requireBackend('core/timeline/denormalizers/user.follow')();
      module.handler(entry).then(function(result) {
        expect(result.target[0]).to.shallowDeepEqual({
          _id: user._id,
          objectType: 'user'
        });
        expect(result.target[0].displayName).to.be.defined;
        expect(result.target[0].image).to.be.defined;
        done();
      }, done);
    });
  });
});
