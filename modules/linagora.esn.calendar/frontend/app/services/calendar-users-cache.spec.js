'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendarUsersCache service', function() {
  var $q,
    $rootScope,
    calendarUsersCache,
    userId,
    user,
    userUtils,
    Cache,
    CAL_USER_CACHE_TTL;

  beforeEach(function() {
    Cache = sinon.spy();
    Cache.prototype.get = sinon.spy();

    angular.mock.module('esn.calendar', function($provide) {
      $provide.value('Cache', Cache);
    });

    angular.mock.inject(function(_$q_, _$rootScope_, _calendarUsersCache_, _userUtils_, _CAL_USER_CACHE_TTL_) {
      $q = _$q_;
      $rootScope = _$rootScope_;
      calendarUsersCache = _calendarUsersCache_;
      userUtils = _userUtils_;
      CAL_USER_CACHE_TTL = _CAL_USER_CACHE_TTL_;
    });
  });

  beforeEach(function() {
    userId = 'userId';
    user = {
      firstname: 'firstname',
      lastname: 'lastname',
      email: 'email'
    };
    Cache.prototype.get = sinon.spy(function() {
      return $q.when({ data: user });
    });
  });

  it('should call Cache constructor with the correct arguments', function() {
    expect(Cache).to.have.been.calledWith({
      loader: sinon.match.func,
      ttl: CAL_USER_CACHE_TTL
    });
  });

  describe('The getUser function', function() {
    it('should call cache.get', function(done) {
      calendarUsersCache.getUser(userId).then(function(userFromCache) {
        expect(userFromCache).to.deep.equal(userFromCache);

        done();
      });

      expect(Cache.prototype.get).to.have.been.calledWith(userId);

      $rootScope.$digest();
    });
  });

  describe('The getUserDisplayName function', function() {
    it('should call cache.get and userUtils.displayNameOf', function(done) {
      sinon.spy(userUtils, 'displayNameOf');

      calendarUsersCache.getUserDisplayName(userId).then(function(userDisplayName) {
        expect(userUtils.displayNameOf).to.have.been.calledWith(user);
        expect(userDisplayName).to.deep.equal(user.firstname + ' ' + user.lastname);

        done();
      });

      expect(Cache.prototype.get).to.have.been.calledWith(userId);

      $rootScope.$digest();
    });
  });
});
