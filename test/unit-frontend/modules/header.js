'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.header Angular module', function() {

  beforeEach(function() {
    module('jadeTemplates');
    module('esnApp');
    module('esn.sidebar');
    module('esn.header');
  });

  describe('The headerService factory', function() {

    var $rootScope, headerService, dynamicDirectiveService, MAIN_HEADER, SUB_HEADER, SUB_HEADER_HAS_INJECTION_EVENT, SUB_HEADER_VISIBLE_MD_EVENT;

    beforeEach(angular.mock.module(function($provide) {

    }));

    beforeEach(inject(function(_$rootScope_, _headerService_, _dynamicDirectiveService_, _MAIN_HEADER_, _SUB_HEADER_, _SUB_HEADER_HAS_INJECTION_EVENT_, _SUB_HEADER_VISIBLE_MD_EVENT_) {
      $rootScope = _$rootScope_;
      headerService = _headerService_;
      dynamicDirectiveService = _dynamicDirectiveService_;
      MAIN_HEADER = _MAIN_HEADER_;
      SUB_HEADER = _SUB_HEADER_;
      SUB_HEADER_HAS_INJECTION_EVENT = _SUB_HEADER_HAS_INJECTION_EVENT_;
      SUB_HEADER_VISIBLE_MD_EVENT = _SUB_HEADER_VISIBLE_MD_EVENT_;
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

    describe('The subHeader.setVisibleMD function', function() {

      it('should broadcast an event to SUB_HEADER_VISIBLE_MD_EVENT', function(done) {

        $rootScope.$on(SUB_HEADER_VISIBLE_MD_EVENT, function(event, data) {
          expect(data).to.be.true;
          done();
        });
        headerService.subHeader.setVisibleMD();
      });

    });

  });

  describe('The mainHeader directive', function() {
    var hasInjectionsSpy = sinon.spy();

    beforeEach(module(function($provide) {
      $provide.provider('sidebarDirective', function() {
        this.$get = function() { return {}; };
      });
      $provide.provider('apiNotificationDirective', function() {
        this.$get = function() { return {}; };
      });
      $provide.value('headerService', {
        subHeader: {
          hasInjections: hasInjectionsSpy
        }
      });
    }));

    beforeEach(inject(function($compile, $rootScope, SUB_HEADER_VISIBLE_MD_EVENT) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.SUB_HEADER_VISIBLE_MD_EVENT = SUB_HEADER_VISIBLE_MD_EVENT;

      var html = '<main-header></main-header>';
      this.element = this.$compile(html)(this.$scope);
      this.$scope.$digest();
    }));

    it('should recompute sub header injections on \'sub-header:hasInjection\'', function() {
      this.$rootScope.$broadcast('sub-header:hasInjection', true);
      expect(hasInjectionsSpy).to.have.been.called;
      expect(this.$scope.hasSubHeaderGotInjections).to.be.true;
    });

    it('should listen to SUB_HEADER_VISIBLE_MD_EVENT and expose the its value to subHeaderVisibleMd', function() {
      expect(this.$scope.subHeaderVisibleMd).to.be.undefined;

      this.$scope.$broadcast(this.SUB_HEADER_VISIBLE_MD_EVENT, true);
      expect(this.$scope.subHeaderVisibleMd).to.be.true;

      this.$scope.$broadcast(this.SUB_HEADER_VISIBLE_MD_EVENT, false);
      expect(this.$scope.subHeaderVisibleMd).to.be.false;
    });

    it('should set subHeaderVisibleMd to false when the state is successfully changed ', function() {
      this.$scope.$broadcast('$stateChangeSuccess');

      expect(this.$scope.subHeaderVisibleMd).to.be.false;
    });

    describe('the hideEventListener', function() {

      it('should hide header when a hide-header event is received', function() {
        this.$rootScope.$broadcast('header:hide', '');
        expect(this.element.hasClass('hidden')).to.equal(true);
      });

      it('should show header when a show-header event is received', function() {
        this.$rootScope.$broadcast('header:show', '');
        expect(this.element.hasClass('hidden')).to.equal(false);
      });
    });

  });
});
