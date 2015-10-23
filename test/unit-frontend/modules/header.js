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

  describe('The mainHeader directive', function() {
    var sideBarServiceMock = {};
    var spy = sinon.spy();

    beforeEach(module(function($provide) {
      sideBarServiceMock.isLeftSideBarOpen = function() { return false; };
      $provide.value('sideBarService', sideBarServiceMock);
      $provide.provider('sidebarDirective', function() {
        this.$get = function() { return {}; };
      });
      $provide.provider('apiNotificationDirective', function() {
        this.$get = function() { return {}; };
      });
      $provide.value('headerService', {
        subHeader: {
          hasInjections: spy
        }
      });
    }));

    beforeEach(inject(function($compile, $rootScope, SIDEBAR_EVENTS) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.SIDEBAR_EVENTS = SIDEBAR_EVENTS;
      this.$scope = this.$rootScope.$new();

      var html = '<main-header></main-header>';
      this.element = this.$compile(html)(this.$scope);
      this.$scope.$digest();
      this.menuTrigger = this.element.find('#menu-trigger');
    }));

    it('should recompute sub header injections on \'sub-header:hasInjection\'', function() {
      this.$rootScope.$broadcast('sub-header:hasInjection', true);
      expect(spy).to.have.been.called;
      expect(this.$scope.hasSubHeaderGotInjections).to.be.true;
    });

    describe('when receiving "display: true"', function() {

      it('should do nothing if the sidebar is open', function() {
        sideBarServiceMock.isLeftSideBarOpen = function() { return true; };
        this.$rootScope.$broadcast(this.SIDEBAR_EVENTS.display, {display: true});
        expect(this.menuTrigger.hasClass('open')).to.equal(false);
      });

      it('should add the class open', function() {
        this.$rootScope.$broadcast(this.SIDEBAR_EVENTS.display, {display: true});
        expect(this.menuTrigger.hasClass('open')).to.equal(true);
      });
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

    describe('when receiving "display: false"', function() {

      it('should do nothing if the sidebar is close', function() {
        this.$rootScope.$broadcast(this.SIDEBAR_EVENTS.display, {display: false});
        expect(this.menuTrigger.hasClass('open')).to.equal(false);
      });

      it('should remove the class open', function() {
        sideBarServiceMock.isLeftSideBarOpen = function() { return true; };
        this.menuTrigger.addClass('open');
        this.$rootScope.$broadcast(this.SIDEBAR_EVENTS.display, {display: false});
        expect(this.menuTrigger.hasClass('open')).to.equal(false);
      });
    });
  });
});
