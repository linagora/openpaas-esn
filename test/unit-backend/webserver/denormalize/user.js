'use strict';

var mockery = require('mockery');
var q = require('q');
var expect = require('chai').expect;

describe('The webserver user denormalizer', function() {

  describe('The denormalize function', function() {

    beforeEach(function() {
      mockery.registerMock('../controllers/utils', {
        sanitizeUser: function(user) {
          return q(user);
        }
      });
    });

    it('should set the following flag if user is not the current one and is following', function() {
      var user = {_id: this.helpers.objectIdMock('1'), login: {}};

      mockery.registerMock('../../core/user/follow', {
        isFollowedBy: function() {
          return q(true);
        },
        getUserStats: function() {
          return q({});
        }
      });

      var module = this.helpers.requireBackend('webserver/denormalize/user');
      module.denormalize(user, {_id: this.helpers.objectIdMock('2')}).then(function(result) {
        expect(result.following).to.be.true;
      });
    });

    it('should set the follow statistics', function() {
      var followStats = {
        followers: 1,
        followgins: 2
      };
      var user = {login: {}};

      mockery.registerMock('../../core/user/follow', {
        isFollowedBy: function() {
          return q(true);
        },
        getUserStats: function() {
          return q(followStats);
        }
      });

      var module = this.helpers.requireBackend('webserver/denormalize/user');
      module.denormalize(user, {}).then(function(result) {
        expect(result).to.shallowDeepEqual(followStats);
      });
    });

    it('should set the login status', function() {

      mockery.registerMock('../../core/user/follow', {
        isFollowedBy: function() {
          return q(true);
        },
        getUserStats: function() {
          return q({});
        }
      });

      var user = {login: {disabled: true}};
      var module = this.helpers.requireBackend('webserver/denormalize/user');
      module.denormalize(user, {}).then(function(result) {
        expect(result.disabled).to.be.true;
      });
    });
  });

});
