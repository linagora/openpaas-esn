'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.subheader Angular module', function() {

  var $rootScope, $compile, $scope;
  var subHeaderService;

  beforeEach(function() {
    module('jadeTemplates');
    module('esn.subheader');
  });

  beforeEach(inject(function(_$rootScope_, _$compile_, _subHeaderService_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    subHeaderService = _subHeaderService_;
  }));

  function compileDirective(htmlContent, scope) {
    $scope = scope || $rootScope.$new();
    var element = $compile(htmlContent)($scope);
    $scope.$digest();

    return element;
  }

  describe('The directives', function() {

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
      compileDirective('<sub-header><div>subHeader1</div></sub-header>', scope1);

      var scope2 = $rootScope.$new();
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

    it('should has visible-md class if sub header has truthy sub-header-visible-md attribute', function() {
      var container = compileDirective('<sub-header-container />');
      compileDirective('<sub-header sub-header-visible-md="true"><div>subHeader1</div></sub-header>');

      expect(container.hasClass('visible-md')).to.be.true;
    });

    it('should remove visible-md class on $stateChangeStart', function() {
      var container = compileDirective('<sub-header-container />');
      compileDirective('<sub-header sub-header-visible-md="true"><div>subHeader1</div></sub-header>');
      expect(container.hasClass('visible-md')).to.be.true;

      $rootScope.$broadcast('$stateChangeStart');
      expect(container.hasClass('visible-md')).to.be.false;
    });

    describe('The hideOnEmpty attribute', function() {
      it('should hide container on init if hide-on-empty is set to true', function() {
        var container = compileDirective('<sub-header-container hide-on-empty="true" />');
        expect(container.find('#sub-header').css('display')).to.equal('none');
        expect(subHeaderService.isVisible()).to.be.false;
      });

      it('should not hide container on init if hide-on-empty is set to false', function() {
        var container = compileDirective('<sub-header-container hide-on-empty="false" />');
        expect(container.find('#sub-header').css('display')).to.not.equal('none');
        expect(subHeaderService.isVisible()).to.be.true;
      });

      it('should show container again if it has subheaders inside', function() {
        var container = compileDirective('<sub-header-container hide-on-empty="true" />');
        expect(container.find('#sub-header').css('display')).to.equal('none');
        expect(subHeaderService.isVisible()).to.be.false;

        compileDirective('<sub-header><div>subHeader1</div></sub-header>');
        expect(container.find('#sub-header').css('display')).to.not.equal('none');
        expect(subHeaderService.isVisible()).to.be.true;
      });
    });

  });

});
