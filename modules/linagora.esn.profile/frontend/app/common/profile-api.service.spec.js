'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The profileAPI service', function() {

  beforeEach(function() {
    module('linagora.esn.profile');
  });

  describe('The updateProfileField fn', function() {
    beforeEach(angular.mock.inject(function(profileAPI, $httpBackend) {
      this.$httpBackend = $httpBackend;
      this.profileAPI = profileAPI;

      this.fieldName = 'name';
      this.fieldValue = 'fieldValue';
    }));

    it('should send a request to /api/user/profile/fieldName', function() {
      this.$httpBackend.expectPUT('/api/user/profile/' + this.fieldName).respond();
      this.profileAPI.updateProfileField(this.fieldName, this.fieldValue);
      this.$httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = this.profileAPI.updateProfileField(this.request);

      expect(promise.then).to.be.a.function;
    });
  });

  describe('The updateProfile fn', function() {
    beforeEach(angular.mock.inject(function(profileAPI, $httpBackend, Restangular) {
      this.$httpBackend = $httpBackend;
      this.profileAPI = profileAPI;
      Restangular.setFullResponse(true);
    }));

    it('should send a PUT request to /user/profile', function() {
      this.$httpBackend.expectPUT('/api/user/profile').respond(200, []);
      this.profileAPI.updateProfile(this.profile);
      this.$httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = this.profileAPI.updateProfile();

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

      this.$httpBackend.expectPUT('/api/user/profile', object).respond(200, []);
      this.profileAPI.updateProfile(object);
      this.$httpBackend.flush();
    });
  });
});
