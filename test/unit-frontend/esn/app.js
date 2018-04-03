'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn app', function() {
  beforeEach(function() {
    module('esn.core');
    module('esn.session');
    module('esn.websocket');
    module('esn.router');
    angular.mock.module('esnApp');
  });

  var location, rootScope, stateParams, esnRouterHelper;

  beforeEach(inject(function($location, $rootScope, $stateParams, _esnRouterHelper_) {
    location = $location;
    rootScope = $rootScope;
    location = $location;
    stateParams = $stateParams;
    esnRouterHelper = _esnRouterHelper_;
  }));

  describe('state provider', function() {

    it('should load the / page when routing to an unknown path and no continue parameter exists', function() {
      location.path('/unknown');
      rootScope.$digest();
      expect(location.path()).to.equal('/');
      expect(stateParams).to.deep.equal({});
    });

    it('should load the page from continue parameter when routing to an unknown path and the continue page exists', function() {
      var page = '/logout';

      location.path('unknown');
      location.search({continue: page});
      rootScope.$digest();
      expect(location.path()).to.equal(page);
      expect(stateParams).to.deep.equal({});
    });

    it('should load the / page when routing to an unknown path and continue parameter is not an existing page', function() {
      location.path('/unknown');
      location.search({continue: '/notAPage'});
      rootScope.$digest();
      expect(location.path()).to.equal('/');
      expect(stateParams).to.deep.equal({});
    });

    it('should accept to have a trailing slash in the url, even when the state did not set it explicitly', function() {
      var page = '/logout/';

      location.path(page);
      rootScope.$digest();

      expect(location.path()).to.equal(page);
    });

    it('should go to home page when routing to /', function() {
      esnRouterHelper.goToHomePage = sinon.spy();

      location.path('/');
      rootScope.$digest();

      expect(esnRouterHelper.goToHomePage).to.have.been.calledOnce;
    });

  });
});
