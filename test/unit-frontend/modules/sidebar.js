'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Sidebar Angular module', function() {

  beforeEach(function() {
    module('jadeTemplates');
    module('esn.core');
    module('esn.sidebar');
  });

  describe('contextualSidebar directive', function() {
    var toggle;
    var destroy;
    var options;
    var nicescollShow = sinon.spy();
    var nicescollHide = sinon.spy();

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

      $.fn.getNiceScroll = function() {
        return {
          show: nicescollShow,
          hide: nicescollHide
        };
      };
    });

    beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_, _$timeout_) {
      this.$compile = _$compile_;
      this.$rootScope = _$rootScope_;
      this.$scope = this.$rootScope.$new();
      this.$timeout = _$timeout_;

      this.initDirective = function(html, scope) {
        this.element = this.$compile(html)(scope);
        scope.$digest();
        return this.element;
      };
    }));

    it('should allow overriding only template, templateUrl, controller, contentTemplate and placement if it is set to left', function() {
      this.initDirective(
        '<div contextual-sidebar template="template" template-url="templateUrl" controller="controller" content-template="contentTemplate" unkown="unkown" animation="am-fade-left" placement="left"/>',
        this.$scope
      );
      expect(options).to.shallowDeepEqual({
        template: 'template',
        templateUrl: 'templateUrl',
        controller: 'controller',
        contentTemplate: 'contentTemplate',
        placement: 'left'
      });
    });

    it('should allow overriding only template, templateUrl, controller, contentTemplate and placement if it is set to right', function() {
      this.initDirective(
        '<div contextual-sidebar template="template" template-url="templateUrl" controller="controller" content-template="contentTemplate" unkown="unkown" animation="am-fade-right" placement="right"/>',
        this.$scope
      );
      expect(options).to.shallowDeepEqual({
        template: 'template',
        templateUrl: 'templateUrl',
        controller: 'controller',
        contentTemplate: 'contentTemplate',
        placement: 'right'
      });
    });

    it('should automatically set animation to "am-fade-and-slide-left" if placement is set to left', function() {
      this.initDirective(
        '<div contextual-sidebar placement="left"/>',
        this.$scope
      );

      expect(options.animation).to.equal('am-fade-and-slide-left');
    });

    it('should automatically set animation to "am-fade-and-slide-right" if placement is set to right', function() {
      this.initDirective(
        '<div contextual-sidebar placement="right"/>',
        this.$scope
      );

      expect(options.animation).to.equal('am-fade-and-slide-right');
    });

    it('should animation be set to default if placement has a value other than left or right', function() {
      this.initDirective(
        '<div contextual-sidebar placement="top"/>',
        this.$scope
      );
      expect(options.animation).to.be.undefined;
    });

    it('should allow overriding only template, templateUrl, controller and contentTemplate if placement is set to any value other than left or right', function() {
      this.initDirective(
        '<div contextual-sidebar template="template" template-url="templateUrl" controller="controller" content-template="contentTemplate" unkown="unkown" animation="am-fade-left" placement="top"/>',
        this.$scope
      );
      expect(options).to.shallowDeepEqual({
        template: 'template',
        templateUrl: 'templateUrl',
        controller: 'controller',
        contentTemplate: 'contentTemplate'
      });
      expect(options.placement).to.be.undefined;

      this.initDirective(
        '<div contextual-sidebar template="template" template-url="templateUrl" controller="controller" content-template="contentTemplate" unkown="unkown" animation="am-fade-right" placement="top"/>',
        this.$scope
      );
      expect(options).to.shallowDeepEqual({
        template: 'template',
        templateUrl: 'templateUrl',
        controller: 'controller',
        contentTemplate: 'contentTemplate'
      });
      expect(options.placement).to.be.undefined;
    });

    it('should call toggle on click', function() {
      var element = this.initDirective(
        '<div contextual-sidebar/>',
        this.$scope
      );
      element.triggerHandler('click');
      expect(toggle).to.have.been.called;
    });

    it('should call nicescroll show function when the contextual-sidebar.hide event is triggered', function() {
      this.initDirective(
        '<div contextual-sidebar/>',
        this.$scope
      );
      this.$rootScope.$broadcast('contextual-sidebar.hide');

      expect(nicescollShow).to.have.been.called;
    });

    it('should call nicescroll hide function when the contextual-sidebar.show event is triggered', function() {
      this.initDirective(
        '<div contextual-sidebar/>',
        this.$scope
      );
      this.$rootScope.$broadcast('contextual-sidebar.show');

      this.$timeout.flush();

      expect(nicescollHide).to.have.been.called;
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

});
