'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Contact Import Angular Services', function() {

  beforeEach(function() {
    module('esn.core');
  });

  describe('The ContactImportRegistry service', function() {

    beforeEach(function() {
      module('linagora.esn.contact.import');
    });

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
