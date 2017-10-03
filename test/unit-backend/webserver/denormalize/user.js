'use strict';

const mockery = require('mockery');
const q = require('q');
const expect = require('chai').expect;

describe('The webserver user denormalizer', function() {

  describe('The denormalize function', function() {

    beforeEach(function() {
      mockery.registerMock('../../core/user/denormalize', {
        denormalize(user) {
          return user;
        }
      });
      mockery.registerMock('../../core/esn-config', {
        getConfigsForUser: function() {
          return q({modules: []});
        }
      });
    });

    it('should set the following flag if user is not the current one and is following', function() {
      const user = {_id: this.helpers.objectIdMock('1'), login: {}};

      mockery.registerMock('../../core/user/follow', {
        isFollowedBy: function() {
          return q(true);
        },
        getUserStats: function() {
          return q({});
        }
      });

      mockery.registerMock('../../core/platformadmin', {
        isPlatformAdmin: function() {
          return q(false);
        }
      });

      const module = this.helpers.requireBackend('webserver/denormalize/user');

      module.denormalize(user, {_id: this.helpers.objectIdMock('2')}).then(function(result) {
        expect(result.following).to.be.true;
      });
    });

    it('should set the follow statistics', function() {
      const followStats = {
        followers: 1,
        followgins: 2
      };
      const user = {login: {}};

      mockery.registerMock('../../core/user/follow', {
        isFollowedBy: function() {
          return q(true);
        },
        getUserStats: function() {
          return q(followStats);
        }
      });

      mockery.registerMock('../../core/platformadmin', {
        isPlatformAdmin: function() {
          return q(false);
        }
      });

      const module = this.helpers.requireBackend('webserver/denormalize/user');

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

      mockery.registerMock('../../core/platformadmin', {
        isPlatformAdmin: function() {
          return q(false);
        }
      });

      const user = {login: {disabled: true}};
      const module = this.helpers.requireBackend('webserver/denormalize/user');

      module.denormalize(user, {}).then(function(result) {
        expect(result.disabled).to.be.true;
      });
    });

    it('should set isPlatformAdmin to check if user is platform admin', function(done) {
      const isPlatformAdmin = true;
      const user = { login: {} };

      mockery.registerMock('../../core/user/follow', {
        getUserStats: function() {
          return q({});
        }
      });
      mockery.registerMock('../../core/platformadmin', {
        isPlatformAdmin: function() {
          return q(isPlatformAdmin);
        }
      });

      const module = this.helpers.requireBackend('webserver/denormalize/user');

      module.denormalize(user, {}).then(function(result) {
        expect(result.isPlatformAdmin).to.equal(isPlatformAdmin);
        done();
      });
    });
  });

});
