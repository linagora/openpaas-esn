'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.user-status userStatusWebsocketService service', function() {
  var USER_STATUS_EVENTS,
    userStatusWebsocketService,
    livenotificationMock,
    $rootScope,
    userStatusService,
    userStatusNamespace;

  beforeEach(function() {
    userStatusService = {};
    userStatusNamespace = {on: sinon.spy()};

    function livenotificationFactory(USER_STATUS_NAMESPACE) {
      livenotificationMock = function(name) {
        if (name === USER_STATUS_NAMESPACE) {
          return userStatusNamespace;
        }
        throw new Error(name + 'namespace has not been mocked');
      };

      return livenotificationMock;
    }

    angular.mock.module('linagora.esn.user-status', function($provide) {
      $provide.value('userStatusService', userStatusService);
      $provide.factory('livenotification', livenotificationFactory);
    });
  });

  beforeEach(angular.mock.inject(function(_USER_STATUS_, _USER_STATUS_EVENTS_, _$rootScope_, _userStatusWebsocketService_) {
    USER_STATUS_EVENTS = _USER_STATUS_EVENTS_;
    $rootScope = _$rootScope_;
    userStatusWebsocketService = _userStatusWebsocketService_;
  }));

  describe('The listen function', function() {

    it('should listen to USER_STATUS_NAMESPACE:USER_STATUS_EVENTS.USER_CHANGE_STATE and broadcast it on $rootScope', function() {
      $rootScope.$broadcast = sinon.spy();
      userStatusService.cacheUserStatus = sinon.spy(function(status) {
        return status;
      });

      userStatusWebsocketService.listen();
      expect(userStatusNamespace.on).to.have.been.calledWith(USER_STATUS_EVENTS.USER_CHANGE_STATE, sinon.match.func.and(function(callback) {
        var data = {_id: 1, status: 'connected'};

        callback(data);
        expect($rootScope.$broadcast).to.have.been.calledWith(USER_STATUS_EVENTS.USER_CHANGE_STATE, {1: data});
        expect(userStatusService.cacheUserStatus).to.have.been.calledWith(data);

        return true;
      }));
    });

    it('should listen to USER_STATUS_NAMESPACE:USER_STATUS_EVENTS.USER_CHANGE_STATE and not broadcast it on $rootScope when status can not be cached', function() {
      $rootScope.$broadcast = sinon.spy();
      userStatusService.cacheUserStatus = sinon.spy(function() {});

      userStatusWebsocketService.listen();
      expect(userStatusNamespace.on).to.have.been.calledWith(USER_STATUS_EVENTS.USER_CHANGE_STATE, sinon.match.func.and(function(callback) {
        var data = {_id: 1, status: 'connected'};

        callback(data);
        expect($rootScope.$broadcast).to.not.have.been.called;
        expect(userStatusService.cacheUserStatus).to.have.been.calledWith(data);

        return true;
      }));
    });
  });
});
