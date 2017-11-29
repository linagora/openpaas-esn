'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnAvailabilityService service', function() {
  var $httpBackend, esnAvailabilityService;

  beforeEach(module('esn.availability'));

  beforeEach(inject(function(_$httpBackend_, _esnAvailabilityService_) {
    $httpBackend = _$httpBackend_;
    esnAvailabilityService = _esnAvailabilityService_;
  }));

  describe('The checkEmailAvailability fn', function() {
    it('should send GET request to right endpoint to check email availability', function(done) {
      var status = { available: true };
      var email = 'my@email';

      $httpBackend
        .expectGET('/api/availability?resourceId=' + email + '&resourceType=email')
        .respond(status);

      esnAvailabilityService
        .checkEmailAvailability(email)
        .then(function(data) {
          expect(data).to.deep.equal(status);
          done();
        });

      $httpBackend.flush();
    });
  });
});
