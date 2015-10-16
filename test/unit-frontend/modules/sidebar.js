'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Sidebar Angular module', function() {

  beforeEach(function() {
    module('jadeTemplates');
    module('ngRoute');
    module('esn.core');
    module('esn.sidebar');
  });

  describe('The contextualSidebar directive', function() {
    var toggle;
    var destroy;
    var options;

    beforeEach(function() {
      toggle = sinon.spy();
      destroy = sinon.spy();
      var contextualSidebarService = function(opt) {
        options = opt;
        return {
          toggle: toggle,
          destroy: destroy
        };
      };
      angular.mock.module(function($provide) {
        $provide.value('contextualSidebarService', contextualSidebarService);
      });
    });

    beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_) {
      this.$compile = _$compile_;
      this.$rootScope = _$rootScope_;
      this.$scope = this.$rootScope.$new();

      this.initDirective = function(html, scope) {
        this.element = this.$compile(html)(scope);
        scope.$digest();
        return this.element;
      };
    }));

    it('should allow overriding only template, templateUrl, controller and contentTemplate', function() {
      this.initDirective(
        '<div contextual-sidebar template="template" template-url="templateUrl" controller="controller" content-template="contentTemplate" unkown="unkown" animation="am-fade-left"/>',
        this.$scope
      );
      expect(options).to.shallowDeepEqual({
        template: 'template',
        templateUrl: 'templateUrl',
        controller: 'controller',
        contentTemplate: 'contentTemplate'
      });
    });

    it('should call toggle on click', function() {
      var element = this.initDirective(
        '<div contextual-sidebar/>',
        this.$scope
      );
      element.triggerHandler('click');
      expect(toggle).to.have.been.called;
    });

    it('should call destroy on $destroy', function() {
      var element = this.initDirective(
        '<div contextual-sidebar/>',
        this.$scope
      );
      element.scope().$destroy();
      expect(destroy).to.have.been.called;
    });

  });

  describe('The sidebar directive', function() {
    var sideBarServiceMock = {};
    var $documentMock = [{
      documentMode: 'test'
    }];
    var documentOnClickHandler;
    var event = {};

    beforeEach(module(function($provide, $controllerProvider) {
      sideBarServiceMock.isLeftSideBarOpen = function() { return false; };
      sideBarServiceMock.closeLeftSideBar = function() {};
      documentOnClickHandler = null;
      $documentMock.on = function(event, handler) {
        if (event === 'click') {
          documentOnClickHandler = handler;
        }
      };
      $documentMock.off = function(event, handler) {
        if (event === 'click' && handler === documentOnClickHandler) {
          documentOnClickHandler = null;
        }
      };
      event.isDefaultPrevented = function() {};
      event.target = {};
      $provide.value('sideBarService', sideBarServiceMock);
      $provide.value('$document', $documentMock);
      $controllerProvider.register('avatarController', function() {});
      $controllerProvider.register('currentDomainController', function() {});
      $controllerProvider.register('ASTrackerController', function() {});
    }));

    beforeEach(inject(function($compile, $rootScope, $timeout, SIDEBAR_EVENTS) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$timeout = $timeout;
      this.SIDEBAR_EVENTS = SIDEBAR_EVENTS;
      this.$scope = this.$rootScope.$new();

      var html = '<sidebar></sidebar><div id="outside"></div>';
      this.element = this.$compile(html)(this.$scope);
      this.$scope.$digest();
      this.sidebar = this.element.siblings('#sidebar');
      this.outside = this.element.siblings('#outside');
    }));

    describe('when receiving "display: true"', function() {

      it('should do nothing if the side bar is already open', function() {
        sideBarServiceMock.isLeftSideBarOpen = function() { return true; };
        this.$rootScope.$broadcast(this.SIDEBAR_EVENTS.display, {display: true});
        expect(this.sidebar.hasClass('toggled')).to.equal(false);
      });

      it('should broadcast "open", add the class "toggled", register a listener and broadcast "opened"', function() {
        var openCalled = sinon.spy();
        var openedCalled = sinon.spy();

        this.$scope.$on(this.SIDEBAR_EVENTS.open, function() {
          openCalled();
        });

        this.$scope.$on(this.SIDEBAR_EVENTS.open, function() {
          openedCalled();
        });

        this.$rootScope.$broadcast(this.SIDEBAR_EVENTS.display, {display: true});
        expect(this.sidebar.hasClass('toggled')).to.equal(true);
        expect(openCalled).to.have.been.called;
        expect(openedCalled).to.have.been.called;
        this.$timeout.flush();
        expect(documentOnClickHandler).to.exist;
      });

      it('should call scope.onClickOutside when clicking outside of the sidebar', function() {
        var onClickOutsideCalled = sinon.spy();
        this.$scope.onClickOutside = function() {
          onClickOutsideCalled();
        };
        this.$rootScope.$broadcast(this.SIDEBAR_EVENTS.display, {display: true});
        this.$timeout.flush();
        expect(documentOnClickHandler).to.exist;
        event.target = this.outside.get(0);
        documentOnClickHandler(event);
        expect(onClickOutsideCalled).to.have.been.called;
      });

      it('should not call scope.onClickOutside when clicking inside of the sidebar', function() {
        var onClickOutsideCalled = sinon.spy();
        this.$scope.onClickOutside = function() {
          onClickOutsideCalled();
        };
        this.$rootScope.$broadcast(this.SIDEBAR_EVENTS.display, {display: true});
        this.$timeout.flush();
        expect(documentOnClickHandler).to.exist;
        event.target = this.sidebar.get(0);
        documentOnClickHandler(event);
        expect(onClickOutsideCalled).to.not.have.been.called;
      });
    });

    describe('when receiving "display: false"', function() {

      it('should do nothing if the side bar is already close', function() {
        sideBarServiceMock.isLeftSideBarOpen = function() { return false; };
        this.$rootScope.$broadcast(this.SIDEBAR_EVENTS.display, {display: false});
        expect(this.sidebar.hasClass('toggled')).to.equal(false);
      });

      it('should broadcast "close", remove the class "toggled", unregister a listener and broadcast "closed"', function() {
        var openCalled = sinon.spy();
        var openedCalled = sinon.spy();

        this.$scope.$on(this.SIDEBAR_EVENTS.close, function() {
          openCalled();
        });

        this.$scope.$on(this.SIDEBAR_EVENTS.closed, function() {
          openedCalled();
        });

        this.$rootScope.$broadcast(this.SIDEBAR_EVENTS.display, {display: true});
        sideBarServiceMock.isLeftSideBarOpen = function() { return true; };
        this.$rootScope.$broadcast(this.SIDEBAR_EVENTS.display, {display: false});
        expect(this.sidebar.hasClass('toggled')).to.equal(false);
        expect(openCalled).to.have.been.called;
        expect(openedCalled).to.have.been.called;
        expect(documentOnClickHandler).to.not.exist;
      });
    });
  });

  describe('The sideBarService service', function() {

    beforeEach(inject(function($compile, $rootScope, SIDEBAR_EVENTS, sideBarService) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.SIDEBAR_EVENTS = SIDEBAR_EVENTS;

      this.sideBarService = sideBarService;
    }));

    describe('isLeftSideBarOpen function', function() {

      it('should return the left bar status', function() {
        expect(this.sideBarService.isLeftSideBarOpen()).to.equal(false);
      });
    });

    describe('openLeftSideBar function', function() {

      it('should broadcast "display: true" once', function() {
        var self = this;
        var called = sinon.spy();

        this.$rootScope.$on(this.SIDEBAR_EVENTS.display, function(event, data) {
          called();
          expect(data.display).to.equal(true);
          self.$rootScope.$broadcast(self.SIDEBAR_EVENTS.opened);
        });

        this.sideBarService.openLeftSideBar();
        expect(this.sideBarService.isLeftSideBarOpen()).to.equal(true);
        this.sideBarService.openLeftSideBar();
        this.sideBarService.openLeftSideBar();
        expect(called).to.have.been.calledOnce;
      });
    });

    describe('closeLeftSideBar function', function() {

      it('should broadcast "display: false" once', function() {
        var self = this;
        var called = sinon.spy();

        this.$rootScope.$on(this.SIDEBAR_EVENTS.display, function(event, data) {
          if (data.display) {
            self.$rootScope.$broadcast(self.SIDEBAR_EVENTS.opened);
          } else {
            called();
            self.$rootScope.$broadcast(self.SIDEBAR_EVENTS.closed);
          }
        });

        this.sideBarService.openLeftSideBar();
        expect(this.sideBarService.isLeftSideBarOpen()).to.equal(true);
        this.sideBarService.closeLeftSideBar();
        this.sideBarService.closeLeftSideBar();
        expect(called).to.have.been.calledOnce;
      });
    });

    describe('toggleLeftSideBar function', function() {

      it('should broadcast "display: true" and "display: false"', function() {
        var self = this;
        var called = sinon.spy();

        this.$rootScope.$on(this.SIDEBAR_EVENTS.display, function(event, data) {
          if (data.display) {
            self.$rootScope.$broadcast(self.SIDEBAR_EVENTS.opened);
          } else {
            self.$rootScope.$broadcast(self.SIDEBAR_EVENTS.closed);
          }
          called();
        });

        this.sideBarService.toggleLeftSideBar();
        expect(this.sideBarService.isLeftSideBarOpen()).to.equal(true);
        this.sideBarService.toggleLeftSideBar();
        expect(this.sideBarService.isLeftSideBarOpen()).to.equal(false);
        this.sideBarService.toggleLeftSideBar();
        expect(this.sideBarService.isLeftSideBarOpen()).to.equal(true);
        expect(called).to.have.been.calledThrice;
      });
    });
  });
});
