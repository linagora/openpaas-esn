'use strict';

describe('The esnTechnicalUserAPIClient service', function() {
    var $httpBackend;
    var esnTechnicalUserAPIClient;
    var domainId, technicalUser;

    beforeEach(module('esn.technicaluser'));

    beforeEach(inject(function(_$httpBackend_, _esnTechnicalUserAPIClient_) {
      $httpBackend = _$httpBackend_;
      esnTechnicalUserAPIClient = _esnTechnicalUserAPIClient_;

      domainId = 1;
      technicalUser = { _id: 123 };
    }));

    describe('The list function', function() {
      it('should send a request to /api/domains/:domainId/technicalusers', function() {
        var options = {
          offset: 5,
          limit: 30
        };

        $httpBackend.expectGET('/api/domains/' + domainId + '/technicalusers?limit=' + options.limit + '&offset=' + options.offset).respond(200, []);

        esnTechnicalUserAPIClient.list(domainId, options);
        $httpBackend.flush();
      });
    });

    describe('The add function', function() {
      it('should send a request to /api/domains/:domainId/technicalusers', function() {
        $httpBackend.expectPOST('/api/domains/' + domainId + '/technicalusers').respond(201, []);

        esnTechnicalUserAPIClient.add(domainId, technicalUser);
        $httpBackend.flush();
      });
    });

    describe('The update function', function() {
      it('should send a request to /api/domains/:domainId/technicalusers/:technicalUserId', function() {
        $httpBackend.expectPUT('/api/domains/' + domainId + '/technicalusers/' + technicalUser._id).respond(204, []);

        esnTechnicalUserAPIClient.update(domainId, technicalUser);
        $httpBackend.flush();
      });
    });

    describe('The remove function', function() {
      it('should send a request to /api/domains/:domainId/technicalusers/:technicalUserId', function() {
        $httpBackend.expectDELETE('/api/domains/' + domainId + '/technicalusers/' + technicalUser._id).respond(204, []);

        esnTechnicalUserAPIClient.remove(domainId, technicalUser);
        $httpBackend.flush();
      });
    });
});
