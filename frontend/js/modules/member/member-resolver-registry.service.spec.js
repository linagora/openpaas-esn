'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnMemberResolverRegistry service', function() {
  var esnMemberResolverRegistry;

  beforeEach(function() {
    module('esn.member');
    inject(function(_esnMemberResolverRegistry_) {
      esnMemberResolverRegistry = _esnMemberResolverRegistry_;
    });
  });

  it('should be able to add a resolver and retrieve it', function() {
    var resolve = function() {};
    var objectType = 'core.user';

    esnMemberResolverRegistry.addResolver({ objectType: objectType, resolve: resolve });
    expect(esnMemberResolverRegistry.getResolver(objectType).resolve).to.equal(resolve);
  });
});
