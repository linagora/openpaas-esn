'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.router Angular module', function() {

  beforeEach(module('esn.router'));

  describe('The esnRouterHelper service', function() {

    describe('The goToHomePage fn', function() {

      var $rootScope, $state, session, esnRouterHelper, ESN_ROUTER_DEFAULT_HOME_PAGE;

      beforeEach(inject(function(_$rootScope_, _$state_, _session_, _esnRouterHelper_, _ESN_ROUTER_DEFAULT_HOME_PAGE_) {
        $rootScope = _$rootScope_;
        $state = _$state_;
        session = _session_;
        esnRouterHelper = _esnRouterHelper_;
        ESN_ROUTER_DEFAULT_HOME_PAGE = _ESN_ROUTER_DEFAULT_HOME_PAGE_;

        session.setDomain({ _id: 'domain123' });
      }));

      it('should go to home page of current user when it is valid', function() {
        var homePage = 'a valid state';

        session.setUser({
          _id: 'user123',
          emails: [],
          preferences: {
            homePage: homePage
          }
        });
        $state.href = sinon.stub().returns('/valid/url');
        $state.go = sinon.spy();

        esnRouterHelper.goToHomePage();
        $rootScope.$digest();

        expect($state.href).to.have.been.calledWith(homePage);
        expect($state.go).to.have.been.calledWith(homePage);
      });

      it('should go to default home page if the user\'s home page is an invalid state', function() {
        var homePage = 'an invalid state';

        session.setUser({
          _id: 'user123',
          emails: [],
          preferences: {
            homePage: homePage
          }
        });
        // $state.href returns null when state is invalid
        $state.href = sinon.stub().returns(null);
        $state.go = sinon.spy();

        esnRouterHelper.goToHomePage();
        $rootScope.$digest();

        expect($state.href).to.have.been.calledWith(homePage);
        expect($state.go).to.have.been.calledWith(ESN_ROUTER_DEFAULT_HOME_PAGE);
      });

    });

  });

});
