'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The profileAPI service', function() {
  var $httpBackend, profileApi;

  beforeEach(function() {
    module('linagora.esn.profile');

    inject(function(_$httpBackend_, _profileAPI_) {
      $httpBackend = _$httpBackend_;
      profileApi = _profileAPI_;
    });
  });

  describe('The updateProfileField fn', function() {
    beforeEach(function() {
      this.fieldName = 'name';
      this.fieldValue = 'fieldValue';
    });

    it('should send a request to /api/user/profile/fieldName', function() {
      $httpBackend.expectPUT('/api/user/profile/' + this.fieldName).respond();

      profileApi.updateProfileField(this.fieldName, this.fieldValue);
      $httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = profileApi.updateProfileField(this.request);

      expect(promise.then).to.be.a.function;
    });
  });

  describe('The updateProfile fn', function() {
    it('should send a PUT request to /user/profile', function() {
      $httpBackend.expectPUT('/api/user/profile').respond(200, []);

      profileApi.updateProfile(this.profile);
      $httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = profileApi.updateProfile();

      expect(promise.then).to.be.a.function;
    });

    it('should send a PUT request, sending the correct profile object', function() {
      var object = {
        firstname: 'john',
        lastname: 'Amaly',
        job_title: 'Engineer',
        service: 'IT',
        building_location: 'Tunis',
        office_location: 'France',
        main_phone: 'Engineer',
        description: 'This is my description'
      };

      $httpBackend.expectPUT('/api/user/profile', object).respond(200, []);

      profileApi.updateProfile(object);
      $httpBackend.flush();
    });
  });

  describe('The updateUserProfile function', function() {
    it('should send a PUT request to /users/userId?domain_id=domainId', function() {
      var userId = '123';
      var domainId = '456';
      var newProfile = {
        firstname: 'john',
        lastname: 'Amaly',
        job_title: 'Engineer',
        service: 'IT',
        building_location: 'Tunis',
        office_location: 'France',
        main_phone: 'Engineer',
        description: 'This is my description'
      };

      $httpBackend.expectPUT('/api/users/' + userId + '?domain_id=' + domainId, newProfile).respond(200, {});

      profileApi.updateUserProfile(newProfile, userId, domainId);
      $httpBackend.flush();
    });
  });
});
