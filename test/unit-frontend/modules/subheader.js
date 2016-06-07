'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.subheader Angular module', function() {

  var $rootScope, $compile, $scope;

  beforeEach(function() {
    module('jadeTemplates');
    module('esn.subheader');
  });

  beforeEach(inject(function(_$rootScope_, _$compile_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
  }));

  function compileDirective(htmlContent, scope) {
    $scope = scope || $rootScope.$new();
    var element = $compile(htmlContent)($scope);

    $scope.$digest();

    return element;
  }

  describe('The directive injection', function() {

    it('should move sub headers to sub header container', function() {
      var container = compileDirective('<sub-header-container />');

      compileDirective('<sub-header><div>subHeader1</div></sub-header>');
      compileDirective('<sub-header><div>subHeader2</div></sub-header>');

      var containerHtmlContent = container.html();

      expect(containerHtmlContent).to.contain('subHeader1');
      expect(containerHtmlContent).to.contain('subHeader2');
    });

    it('should respect sub header scope', function() {
      var container = compileDirective('<sub-header-container />');
      var scope = $rootScope.$new();

      scope.name = 'Alice';
      compileDirective('<sub-header><div>Hello {{name}}</div></sub-header>', scope);

      expect(container.html()).to.contain('Hello Alice');

      scope.name = 'Bob';
      scope.$digest();

      expect(container.html()).to.contain('Hello Bob');
    });

    it('should remove the sub header from container on $destroy event', function() {
      var container = compileDirective('<sub-header-container />');
      var scope1 = $rootScope.$new();
      var scope2 = $rootScope.$new();

      compileDirective('<sub-header><div>subHeader1</div></sub-header>', scope1);
      compileDirective('<sub-header><div>subHeader2</div></sub-header>', scope2);

      scope2.$destroy();
      var containerHtmlContent = container.html();

      expect(containerHtmlContent).to.contain('subHeader1');
      expect(containerHtmlContent).to.not.contain('subHeader2');
    });

    it('should still work properly when container is initialized after sub header', function() {
      compileDirective('<sub-header><div>subHeader1</div></sub-header>');
      var container = compileDirective('<sub-header-container />');

      expect(container.html()).to.contain('subHeader1');
    });

  });

  describe('The directive visibility', function() {

    var subHeaderService, screenSize, oldChildrenFn;

    beforeEach(inject(function(_subHeaderService_, _screenSize_) {
      subHeaderService = _subHeaderService_;
      screenSize = _screenSize_;

      oldChildrenFn = null;
    }));

    afterEach(function() {
      if (oldChildrenFn) {
        jQuery.fn.children = oldChildrenFn;
      }
    });

    function mockVisibleChildren(visibleChildren) {
      if (!oldChildrenFn) {
        oldChildrenFn = jQuery.fn.children;
      }

      jQuery.fn.children = function() {
        return { length: visibleChildren };
      };
    }

    it('should hide container if no sub header is injected', function() {
      var container = compileDirective('<sub-header-container />');

      expect(container.find('#sub-header').css('display')).to.equal('none');
      expect(subHeaderService.isVisible()).to.be.false;
    });

    it('should hide container if there is no visible sub header injected', function() {
      var container = compileDirective('<sub-header-container />');

      compileDirective('<sub-header><div style="display:none">subHeader1</div></sub-header>');

      expect(container.find('#sub-header').css('display')).to.equal('none');
      expect(subHeaderService.isVisible()).to.be.false;
    });

    it('should show container if there is visible sub header injected', function() {
      mockVisibleChildren(1);

      var container = compileDirective('<sub-header-container />');

      compileDirective('<sub-header><div>subHeader1</div></sub-header>');

      expect(container.find('#sub-header').css('display')).to.not.equal('none');
      expect(subHeaderService.isVisible()).to.be.true;
    });

    it('should ensure the visibility of the container on screen size change', function() {
      mockVisibleChildren(1);

      var ensureVisible;

      screenSize.onChange = function(scope, sizes, callback) {
        ensureVisible = callback;

        expect(scope).to.be.defined;
        expect(sizes).to.equal('xs, sm');
        expect(callback).to.be.a.function;
      };

      var container = compileDirective('<sub-header-container />');

      compileDirective('<sub-header><div>subHeader1</div></sub-header>');

      expect(container.find('#sub-header').css('display')).to.not.equal('none');
      expect(subHeaderService.isVisible()).to.be.true;

      mockVisibleChildren(0);
      ensureVisible();

      expect(container.find('#sub-header').css('display')).to.equal('none');
      expect(subHeaderService.isVisible()).to.be.false;

    });

  });

  describe('The subHeaderAware directive', function() {

    var subHeaderService, SUBHEADER_AWARE_CLASS;

    beforeEach(inject(function(_subHeaderService_, _SUBHEADER_AWARE_CLASS_) {
      subHeaderService = _subHeaderService_;
      SUBHEADER_AWARE_CLASS = _SUBHEADER_AWARE_CLASS_;
    }));

    it('should add SUBHEADER_AWARE_CLASS on initialization if sub header is visible', function() {
      subHeaderService.isVisible = function() { return true; };

      var element = compileDirective('<div sub-header-aware></div>');

      expect(element.hasClass(SUBHEADER_AWARE_CLASS)).to.be.true;
    });

    it('should not add SUBHEADER_AWARE_CLASS on initialization if sub header is invisible', function() {
      subHeaderService.isVisible = function() { return false; };

      var element = compileDirective('<div sub-header-aware></div>');

      expect(element.hasClass(SUBHEADER_AWARE_CLASS)).to.be.false;
    });

    it('should add/remove SUBHEADER_AWARE_CLASS on SUBHEADER_VISIBLE_EVENT', function() {
      var element = compileDirective('<div sub-header-aware></div>');

      subHeaderService.setVisible(true);
      expect(element.hasClass(SUBHEADER_AWARE_CLASS)).to.be.true;

      subHeaderService.setVisible(false);
      expect(element.hasClass(SUBHEADER_AWARE_CLASS)).to.be.false;
    });

  });

});
