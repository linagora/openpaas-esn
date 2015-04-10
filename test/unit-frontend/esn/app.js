'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn app', function() {
  beforeEach(angular.mock.module('esnApp'));

  var location, route, rootScope, httpBackend;

  beforeEach(inject(function($location, $route, $rootScope, $httpBackend) {
    location = $location;
    route = $route;
    rootScope = $rootScope;
    httpBackend = $httpBackend;
  }));

  describe('route provider', function() {
    it('should load the communities page when routing to an unknown path and no continue parameter exists', function() {
      httpBackend.expectGET('/views/esn/partials/communities').respond(200);
      location.path('/unknown');
      rootScope.$digest();
      expect(route.current.originalPath).to.equal('/communities');
      expect(route.current.params).to.deep.equal({});
    });

    it('should load the page from continue parameter when routing to an unknown path and the continue page exists', function() {
      httpBackend.expectGET('/views/esn/partials/profile').respond(200);
      location.path('unknown');
      location.search({continue: '/profile'});
      rootScope.$digest();
      expect(route.current.originalPath).to.equal('/profile');
      expect(route.current.params).to.deep.equal({});
    });

    it('should load the commuinites page when routing to an unknown path and continue parameter is not an existing page', function() {
      httpBackend.expectGET('/views/esn/partials/communities').respond(200);
      location.path('/unknown');
      location.search({continue: '/notAPage'});
      rootScope.$digest();
      expect(route.current.originalPath).to.equal('/communities');
      expect(route.current.params).to.deep.equal({});
    });
  });
});
