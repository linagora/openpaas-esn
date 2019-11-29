'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ContactGroupAddressbookDisplayShell service', function() {
  var esnI18nService, ContactGroupAddressbookDisplayShell;

  beforeEach(function() {
    module('linagora.esn.contact');

    inject(function(_esnI18nService_, _ContactGroupAddressbookDisplayShell_) {
      ContactGroupAddressbookDisplayShell = _ContactGroupAddressbookDisplayShell_;
      esnI18nService = _esnI18nService_;
    });
  });

  describe('The ContactGroupAddressbookDisplayShell function', function() {
    it('should call I18n to translate when shell have a name', function() {
      var nameBeforeTranlating = 'a';
      var nameAfterTranslating = 'b';
      var shell = { name: nameBeforeTranlating };

      esnI18nService.translate = sinon.spy(function() { return nameAfterTranslating; });

      var displayShell = new ContactGroupAddressbookDisplayShell(shell);

      expect(esnI18nService.translate).to.have.been.calledOnce;
      expect(esnI18nService.translate).to.have.been.calledWith(nameBeforeTranlating);
      expect(displayShell.displayName).to.equal(nameAfterTranslating);
    });
  });
});
