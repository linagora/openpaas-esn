'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Contact Import Angular Services', function() {

  beforeEach(function() {
    module('ngRoute');
    module('esn.core');
    module('linagora.esn.contact.import');
  });

  describe('The ContactImporterService service', function() {

    beforeEach(angular.mock.inject(function($rootScope, $httpBackend, ContactImporterService) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.$scope = $rootScope.$new();
      this.ContactImporterService = ContactImporterService;
    }));

    it('should send POST request to /import/api/:type', function() {
      var type = 'twitter';
      var account = {
        _id: 123
      };

      this.$httpBackend.expectPOST('/import/api/' + type, {account_id: account._id}).respond([]);
      this.ContactImporterService.import(type, account);
      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });
  });

  describe('The ContactImportRegistry service', function() {

    beforeEach(angular.mock.inject(function(ContactImportRegistry, $rootScope) {
      this.$rootScope = $rootScope;
      this.ContactImportRegistry = ContactImportRegistry;
    }));

    it('should send back the registered function', function() {
      var provider = function() {
        return 1;
      };
      var type = 'twitter';

      this.ContactImportRegistry.register(type, provider);
      var result = this.ContactImportRegistry.get(type);
      expect(result()).to.equal(1);
    });

    it('should not return the function if not registered', function() {
      var type = 'other';

      var result = this.ContactImportRegistry.get(type);
      expect(result).to.not.exist;
    });

  });
});
