'use strict';

describe('The Twitter Angular Services', function() {

  describe('The contactImporter service', function() {

    beforeEach(function() {
      module('ngRoute');
      module('linagora.esn.account');
      module('esn.core');
    });

    beforeEach(angular.mock.inject(function($rootScope, $httpBackend, contactImporterService) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.$scope = $rootScope.$new();
      this.contactImporterService = contactImporterService;
    }));

    it('should send POST request to /import/api/twitter', function() {
      this.$httpBackend.expectPOST('/import/api/twitter').respond([]);
      this.contactImporterService.importContact('twitter');
      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });
  });
});
