'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The welcome app', function() {

  var location, route, rootScope;

  beforeEach(module('linagora.esn.signup'));

  beforeEach(inject(function($location, $route, $rootScope) {
    location = $location;
    route = $route;
    rootScope = $rootScope;
  }));

  describe('route provider', function() {

    it('should load the finalize page when routing to /signup/anId', function() {
      var anId = 'testId';

      location.path('/signup/' + anId);
      rootScope.$digest();

      expect(route.current.originalPath).to.equal('/signup/:id');
      expect(route.current.pathParams).to.deep.equal({ id: anId });
    });

    it('should load the confirm page when routing to /confirm', function() {
      location.path('/confirm');
      rootScope.$digest();

      expect(route.current.originalPath).to.equal('/confirm');
      expect(route.current.params).to.deep.equal({});
    });

  });

});
