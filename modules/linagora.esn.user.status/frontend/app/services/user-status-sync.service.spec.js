'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.user-status userStatusSyncService service', function() {
  var $q, $rootScope, USER_STATUS_EVENTS, userStatusSyncService, userStatusClientService, userStatusService;

  beforeEach(function() {
    userStatusClientService = {};
    userStatusService = {};

    angular.mock.module('linagora.esn.user-status', function($provide) {
      $provide.value('userStatusClientService', userStatusClientService);
      $provide.value('userStatusService', userStatusService);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _userStatusSyncService_, _USER_STATUS_EVENTS_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    userStatusSyncService = _userStatusSyncService_;
    USER_STATUS_EVENTS = _USER_STATUS_EVENTS_;
  }));

  describe('The synchronize function', function() {
    it('should not get status nor publish when cache is empty', function() {
      $rootScope.$broadcast = sinon.spy();
      userStatusService.getCache = sinon.spy(function() {
        return {};
      });

      userStatusSyncService.synchronize();
      $rootScope.$digest();

      expect(userStatusService.getCache).to.have.been.calledOnce;
      expect($rootScope.$broadcast).to.not.have.been.called;
    });

    it('should fetch status from cache ids and broadcast them', function() {
      var cache = {1: 'connected', 2: 'connected', 3: 'disconnected'};

      $rootScope.$broadcast = sinon.spy();
      userStatusService.getCache = sinon.spy(function() {
        return cache;
      });
      userStatusService.cacheUserStatus = sinon.spy();
      userStatusClientService.getStatusForUsers = sinon.spy(function() {
        return $q.when({data: [{_id: '1', status: 'connected'}, {_id: '2', status: 'disconnected'}, {_id: '3', status: 'disconnected'}]});
      });

      userStatusSyncService.synchronize();
      $rootScope.$digest();

      expect(userStatusService.getCache).to.have.been.calledOnce;
      expect($rootScope.$broadcast).to.have.been.calledWith(USER_STATUS_EVENTS.USER_CHANGE_STATE, cache);
      expect(userStatusClientService.getStatusForUsers).to.have.been.calledWith(['1', '2', '3']);
      expect(userStatusService.cacheUserStatus).to.have.been.calledThrice;
    });
  });
});
