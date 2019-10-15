'use strict';

describe('The contactMaintenanceDomainMembersService service', function() {
  var $httpBackend, contactMaintenanceDomainMembersService;

  beforeEach(function() {
    module('linagora.esn.contact');

    inject(function(_$httpBackend_, _contactMaintenanceDomainMembersService_) {
      $httpBackend = _$httpBackend_;
      contactMaintenanceDomainMembersService = _contactMaintenanceDomainMembersService_;
    });
  });

  describe('The synchronize method', function() {
    it('should send POST request to synchronize domain members address books', function() {
      $httpBackend.expectPOST('/contact/api/addressbooks/domainmembers/synchronize').respond(201);
      contactMaintenanceDomainMembersService.synchronize();
      $httpBackend.flush();
    });
  });

  describe('The synchronizeForDomain method', function() {
    it('should send POST request to synchronize domain members address book for a particular domain', function() {
      var domainId = 'lng.org';

      $httpBackend.expectPOST('/contact/api/addressbooks/domainmembers/synchronize?domain_id=' + domainId).respond(201);
      contactMaintenanceDomainMembersService.synchronizeForDomain(domainId);
      $httpBackend.flush();
    });
  });
});
