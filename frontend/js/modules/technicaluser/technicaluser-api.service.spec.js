'use strict';

describe('The esnTechnicalUserAPIClient service', function() {
    var $httpBackend;
    var esnTechnicalUserAPIClient;

    beforeEach(module('esn.technicaluser'));

    beforeEach(inject(function(_$httpBackend_, _esnTechnicalUserAPIClient_) {
      $httpBackend = _$httpBackend_;
      esnTechnicalUserAPIClient = _esnTechnicalUserAPIClient_;
    }));

    describe('The list fn', function() {
      it('should send a request to /api/domains/:domainId/technicalusers', function() {
        var domainId = 1;
        var options = {
          offset: 5,
          limit: 30
        };

        $httpBackend.expectGET('/api/domains/' + domainId + '/technicalusers?limit=' + options.limit + '&offset=' + options.offset).respond(200, []);

        esnTechnicalUserAPIClient.list(domainId, options);
        $httpBackend.flush();
      });
    });
});
