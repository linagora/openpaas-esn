'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The linagora.esn.profile Angular module services', function() {

  beforeEach(function() {
    module('linagora.esn.profile');
  });

  describe('The profileAPI service', function() {

    describe('updateProfileField() method', function() {

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
  });

});
