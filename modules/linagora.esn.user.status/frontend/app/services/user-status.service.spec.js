'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.user-status userStatusService service', function() {
  var $rootScope,
    userStatusService,
    userStatusClientService;

  beforeEach(function() {
    userStatusClientService = {};

    angular.mock.module('linagora.esn.user-status', function($provide) {
      $provide.value('userStatusClientService', userStatusClientService);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _userStatusService_) {
    $rootScope = _$rootScope_;
    userStatusService = _userStatusService_;
  }));

  describe('The cacheUserStatus function', function() {
    it('should return when input is undefined', function() {
      var out = userStatusService.cacheUserStatus();

      expect(out).to.not.be.defined;
      expect(userStatusService.getCache()).to.be.empty;
    });

    it('should return when input._id is undefined', function() {
      var out = userStatusService.cacheUserStatus({status: 1});

      expect(out).to.not.be.defined;
      expect(userStatusService.getCache()).to.be.empty;
    });

    it('should return when input.status is undefined', function() {
      var out = userStatusService.cacheUserStatus({_id: 1});

      expect(out).to.not.be.defined;
      expect(userStatusService.getCache()).to.be.empty;
    });

    it('should cache status', function() {
      var status = {_id: 1, status: 2};
      var out = userStatusService.cacheUserStatus(status);

      expect(out).to.equal(status);
      expect(userStatusService.getCache()).to.deep.equal({1: status});
    });
  });

  describe('The getCurrentStatus function', function() {
    it('should return status from cache when available', function() {
      userStatusClientService.getStatusForUser = sinon.spy();

      var id = 1;
      var status = 'connected';
      var callback = sinon.spy(function(_status) {
        expect(_status).to.deep.equal({_id: id, status: status});
        expect(userStatusClientService.getStatusForUser).to.not.have.been.called;
      });

      userStatusService.cacheUserStatus({_id: id, status: status});
      userStatusService.getCurrentStatus(id).then(callback);
      $rootScope.$digest();
    });

    it('should get status from userStatusClientService the first time and cache it for the next times', function() {
      var status = 'connected';
      var userId = 1;
      var callback = sinon.spy();

      userStatusClientService.getStatusForUser = sinon.spy(function() {
        return $q.when({data: {status: status, _id: userId}});
      });

      userStatusService.getCurrentStatus(userId).then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith({status: status, _id: userId});

      userStatusService.getCurrentStatus(userId).then(callback);
      $rootScope.$digest();
      expect(userStatusClientService.getStatusForUser).to.have.been.calledOnce;
    });
  });
});
