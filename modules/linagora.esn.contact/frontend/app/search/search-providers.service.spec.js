'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The contactSearchProviders provider', function() {
  var contactSearchProviders, esnSearchProvider;

  beforeEach(function() {
    esnSearchProvider = sinon.stub().returns(function() {
      return true;
    });
  });

  beforeEach(function() {
    module('linagora.esn.contact', function($provide) {
      $provide.value('esnSearchProvider', esnSearchProvider);
    });
  });

  beforeEach(function() {
    module('linagora.esn.contact');
    inject(function(_contactSearchProviders_) {
      contactSearchProviders = _contactSearchProviders_;
    });
  });

  describe('The contactSearchProviders.get function', function() {
    it('should create esnSearchProvider object one time', function() {
      var esnSearchProviderA = contactSearchProviders.get();
      var esnSearchProviderB = contactSearchProviders.get();

      expect(esnSearchProvider).have.been.calledOnce;
      expect(esnSearchProviderA).to.equal(esnSearchProviderB);
    });
  });
});
