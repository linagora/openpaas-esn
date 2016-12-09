'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The linagora.esn.user-status userStatusService service', function() {
  var USER_STATUS_EVENTS,
    sessionMock,
    user,
    livenotificationMock,
    $rootScope,
    userStatusService,
    userStatusNamespace,
    $httpBackend;

  beforeEach(function() {
    user = {_id: 'userId'};
    userStatusNamespace = {on: sinon.spy()};

    sessionMock = {
      user: user,
      ready: {
        then: function(callback) {
          return callback({user: user});
        }
      }
    };

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
      $provide.value('session', sessionMock);
      $provide.factory('livenotification', livenotificationFactory);
    });
  });

  beforeEach(angular.mock.inject(function(_USER_STATUS_EVENTS_, _$rootScope_, _userStatusService_, _$httpBackend_) {
    USER_STATUS_EVENTS = _USER_STATUS_EVENTS_;
    $rootScope = _$rootScope_;
    userStatusService = _userStatusService_;
    $httpBackend = _$httpBackend_;
  }));

  describe('The userStatusService service', function() {

    it('should listen to USER_STATUS_NAMESPACE:USER_STATUS_EVENTS.USER_CHANGE_STATE and broadcast it on $rootScope', function() {
      $rootScope.$broadcast = sinon.spy();
      expect(userStatusNamespace.on).to.have.been.calledWith(USER_STATUS_EVENTS.USER_CHANGE_STATE, sinon.match.func.and(function(callback) {
        var data = {};

        callback(data);
        expect($rootScope.$broadcast).to.have.been.calledWith(USER_STATUS_EVENTS.USER_CHANGE_STATE, data);

        return true;
      }));
    });

    it('should listen to USER_STATUS_NAMESPACE:USER_STATUS_EVENTS.USER_CHANGE_STATE and save change', function() {
      var userId = 'userId';
      var state = 'of alabama';

      $rootScope.$broadcast = sinon.spy();
      expect(userStatusNamespace.on).to.have.been.calledWith(USER_STATUS_EVENTS.USER_CHANGE_STATE, sinon.match.func.and(function(callback) {
        var promiseCallback = sinon.spy();

        callback({
          userId: userId,
          state: state
        });

        userStatusService.get(userId).then(promiseCallback);
        $rootScope.$digest();
        expect(promiseCallback).to.have.been.calledWith(state);

        return true;
      }));
    });

    it('should get /user-status/api/users/:userId to get the data the first time and cache it for the second time', function() {
      var state = 'state';
      var callback = sinon.spy();

      $httpBackend.expectGET('/user-status/api/users/userId').respond({state: state});
      userStatusService.get('userId').then(callback);
      $rootScope.$digest();
      $httpBackend.flush();
      expect(callback).to.have.been.calledWith(state);
      callback.reset();

      userStatusService.get('userId').then(callback);
      $rootScope.$digest();
      expect(callback).to.have.been.calledWith(state);
    });
  });
});
