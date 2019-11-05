'use strict';

describe('The esnPeopleAPI service', function() {
  var $httpBackend;
  var esnPeopleAPI;

  beforeEach(module('esn.people'));

  beforeEach(inject(function(_$httpBackend_, _esnPeopleAPI_) {
    $httpBackend = _$httpBackend_;
    esnPeopleAPI = _esnPeopleAPI_;
  }));

  describe('The resolve fn', function() {
    it('should POST to right endpoint', function() {
      $httpBackend.expectGET('/api/people/resolve/emailaddress/foo@bar').respond(200);

      esnPeopleAPI.resolve('emailaddress', 'foo@bar');
      $httpBackend.flush();
    });

    it('should add objectTypes query to request if objectTypes option is provided', function() {
      $httpBackend.expectGET('/api/people/resolve/emailaddress/foo@bar?objectTypes=user,contact').respond(200);

      esnPeopleAPI.resolve('emailaddress', 'foo@bar', { objectTypes: ['user', 'contact'] });
      $httpBackend.flush();
    });
  });
});
