'use strict';

describe('The Contact Import Twitter Services', function() {

  describe('The TwitterContactImporter service', function() {

    beforeEach(function() {
      module('ngRoute');
      module('linagora.esn.contact.import.twitter');
      module('esn.core');
    });

    beforeEach(angular.mock.inject(function($rootScope, $httpBackend, ContactImporterService) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.$scope = $rootScope.$new();
      this.ContactImporterService = ContactImporterService;
    }));

    it('should send POST request to /import/api/:type', function() {
      this.$httpBackend.expectPOST('/import/api/twitter').respond([]);
      this.ContactImporterService.importContact('twitter');
      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });
  });
});
