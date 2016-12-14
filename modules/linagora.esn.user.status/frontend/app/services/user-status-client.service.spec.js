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

  describe('The get function', function() {
    it('should call GET /user-status/api/users/:userId', function() {
      var id = '123';

      $httpBackend.expectGET('/user-status/api/users/' + id).respond({state: ''});
      userStatusClientService.get(id);
      $httpBackend.flush();
    });
  });
});
