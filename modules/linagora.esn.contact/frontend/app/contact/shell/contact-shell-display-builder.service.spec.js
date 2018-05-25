'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The ContactShellDisplayBuilder service', function() {

  var DisplayShellProvider = {};

  beforeEach(function() {
    module('linagora.esn.contact', function($provide) {
      $provide.value('DisplayShellProvider', DisplayShellProvider);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(ContactShellDisplayBuilder) {
      this.ContactShellDisplayBuilder = ContactShellDisplayBuilder;
    });
  });

  describe('The build function', function() {
    it('should call the DisplayShell.toDisplayShell function', function() {
      var spy = sinon.spy();

      DisplayShellProvider.toDisplayShell = spy;
      this.ContactShellDisplayBuilder.build({});
      expect(spy).to.have.been.called.once;
    });
  });
});
