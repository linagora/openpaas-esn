'use strict';

describe('The linagora.esn.user-status userStatusClientService service', function() {
  var userStatusClientService, $httpBackend;

  beforeEach(function() {
    angular.mock.module('linagora.esn.user-status');
  });

  beforeEach(angular.mock.inject(function(_userStatusClientService_, _$httpBackend_) {
    userStatusClientService = _userStatusClientService_;
    $httpBackend = _$httpBackend_;
  }));

  describe('The getStatusForUser function', function() {
    it('should call GET /user-status/api/users/:userId', function() {
      var id = '123';

      $httpBackend.expectGET('/user-status/api/users/' + id).respond({_id: id, status: 'connected'});
      userStatusClientService.getStatusForUser(id);
      $httpBackend.flush();
    });
  });

  describe('The getStatusForUsers function', function() {
    it('should call POST /user-status/api/users', function() {
      var ids = [1, 2, 3];

      $httpBackend.expectPOST('/user-status/api/users', ids).respond();
      userStatusClientService.getStatusForUsers(ids);
      $httpBackend.flush();
    });
  });
});
