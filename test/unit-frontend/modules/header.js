'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.header Angular module', function() {

  beforeEach(function() {
    module('jadeTemplates');
    module('esn.core');
    module('esnApp');
    module('esn.sidebar');
    module('esn.header');
    module('esn.profile-menu');
  });

  describe('The headerService factory', function() {

    var $rootScope, headerService, dynamicDirectiveService, SUB_HEADER, SUB_HEADER_HAS_INJECTION_EVENT;

    beforeEach(inject(function(_$rootScope_, _headerService_, _dynamicDirectiveService_, _SUB_HEADER_, _SUB_HEADER_HAS_INJECTION_EVENT_) {
      $rootScope = _$rootScope_;
      headerService = _headerService_;
      dynamicDirectiveService = _dynamicDirectiveService_;
      SUB_HEADER = _SUB_HEADER_;
      SUB_HEADER_HAS_INJECTION_EVENT = _SUB_HEADER_HAS_INJECTION_EVENT_;
    }));

    describe('The subHeader.setInjection function', function() {

      it('should reset injections and append the new one', function() {
        headerService.subHeader.addInjection('previous', { a: 'b' });
        headerService.subHeader.setInjection('a', { a: 'b' });

        expect(dynamicDirectiveService.getInjections(SUB_HEADER)).to.have.length(1);
      });

      it('should broadcast an event', function(done) {
        $rootScope.$on(SUB_HEADER_HAS_INJECTION_EVENT, function(event, data) {
          expect(data).to.equal(true);

          done();
        });

        headerService.subHeader.setInjection('a', { a: 'b' });
      });

    });
  });

  describe('The mainHeader directive', function() {

    var hasInjectionsSpy = sinon.spy(),
        matchmediaQuery, matchmediaCallback;

    beforeEach(module(function($provide) {
      $provide.provider('sidebarDirective', function() {
        this.$get = function() { return {}; };
      });
      $provide.provider('apiNotificationDirective', function() {
        this.$get = function() { return {}; };
      });

      // the block below is meant to get the right callback mock for matchmediaCallback
      // since we have two callbacks called in subheader and header.
      matchmediaCallback = null;
      $provide.value('matchmedia', {
        on: function(query, callback) {
          matchmediaQuery = query;
          if (!matchmediaCallback) {
            matchmediaCallback = callback;
          }
        }
      });
      $provide.value('headerService', {
        subHeader: {
          hasInjections: hasInjectionsSpy
        }
      });
    }));

    beforeEach(inject(function($compile, $rootScope, _SM_XS_MEDIA_QUERY_, _$httpBackend_) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.SM_XS_MEDIA_QUERY = _SM_XS_MEDIA_QUERY_;

      var html = '<main-header></main-header>';
      this.element = this.$compile(html)(this.$scope);

      this.$httpBackend = _$httpBackend_;

      // in the header we put a profileMenu component which use an icon provider that load this icon set
      // if this icon provider is moved somewhere else, this test will have to be moved as well probable.
      this.$httpBackend
          .whenGET('images/mdi/mdi.svg')
          .respond('');

      this.$scope.$digest();
      }));

    it('should recompute sub header injections on \'sub-header:hasInjection\'', function() {
      this.$rootScope.$broadcast('sub-header:hasInjection', true);
      expect(hasInjectionsSpy).to.have.been.called;
      expect(this.$scope.hasSubHeaderGotInjections).to.be.true;
    });

    it('should set subHeaderVisibleMd to false when the state is successfully changed ', function() {
      this.$scope.$broadcast('$stateChangeSuccess');

      expect(this.$scope.subHeaderVisibleMd).to.be.false;
    });

    describe('the enableScrollListener var', function() {

      it('should be called with xs and sm size when the directive is linked', function() {
        expect(matchmediaQuery).to.equal(this.SM_XS_MEDIA_QUERY);
        matchmediaCallback({matches: true});
        expect(this.$scope.enableScrollListener).to.equal(true);
      });

      it('should set enableScrollListener to false when screenSize update to not match media', function() {
        matchmediaCallback({matches: true});
        matchmediaCallback({matches: false});
        expect(this.$scope.enableScrollListener).to.equal(false);
      });

      it('should set enableScrollListener to true when screenSize update to match media', function() {
        matchmediaCallback({matches: false});
        matchmediaCallback({matches: true});
        expect(this.$scope.enableScrollListener).to.equal(true);
      });

    });
  });
});
