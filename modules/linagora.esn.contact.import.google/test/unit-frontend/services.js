'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Contact Import Google Services', function() {

  describe('The GoogleContactImporter service', function() {

    var ContactImporterMock;

    beforeEach(function() {
      module('linagora.esn.contact.import.google');
    });

    beforeEach(function() {
      ContactImporterMock = {};
      module(function($provide) {
        $provide.value('ContactImporterService', ContactImporterMock);
      });

      inject(function($rootScope, $httpBackend, GoogleContactImporter) {
        this.$rootScope = $rootScope;
        this.$scope = $rootScope.$new();
        this.GoogleContactImporter = GoogleContactImporter;
      });
    });

    it('should call the ContactImporter', function() {
      var importContacts = sinon.spy();
      ContactImporterMock.import = importContacts;
      var account = {_id: 929292};
      this.GoogleContactImporter.import(account);
      this.$rootScope.$apply();
      expect(importContacts).to.have.been.calledWith('google', account);
    });
  });
});
