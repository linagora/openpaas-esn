'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.header Angular module', function() {

  beforeEach(function() {
    module('jadeTemplates');
    module('esnApp');
    module('esn.sidebar');
    module('esn.header');
  });

  describe('The esnHeader directive', function() {
    var sideBarServiceMock = {};

    beforeEach(module(function($provide) {
      sideBarServiceMock.isLeftSideBarOpen = function() { return false; };
      $provide.value('sideBarService', sideBarServiceMock);
      $provide.provider('sidebarDirective', function() {
        this.$get = function() { return {}; };
      });
      $provide.provider('apiNotificationDirective', function() {
        this.$get = function() { return {}; };
      });
    }));

    beforeEach(inject(function($compile, $rootScope, SIDEBAR_EVENTS) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.SIDEBAR_EVENTS = SIDEBAR_EVENTS;
      this.$scope = this.$rootScope.$new();

      var html = '<esn-header></esn-header>';
      this.element = this.$compile(html)(this.$scope);
      this.$scope.$digest();
      this.menuTrigger = this.element.find('#menu-trigger');
    }));

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
