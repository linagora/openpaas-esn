'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The UI module', function() {

  var $window, $compile, $rootScope, $scope, element;

  function initDirective(html) {
    element = $compile(html)($scope);
    $scope.$digest();
  }

  beforeEach(module('esn.ui'));
  beforeEach(module('esn.scroll'));
  beforeEach(module('jadeTemplates'));

  describe('The fab directive', function() {

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
    }));

    it('should set icon class to the one matching the icon attribute', function() {
      initDirective('<fab icon="next"></fab>');

      expect(element.find('i').hasClass('mdi-arrow-right')).to.equal(true);
    });

    it('should set icon class to the default one when icon attribute is not defined', function() {
      initDirective('<fab></fab>');

      expect(element.find('i').hasClass('mdi-plus')).to.equal(true);
    });

    it('should set icon class to the default one when icon attribute is not known', function() {
      initDirective('<fab icon="makeMeASandwitch"></fab>');

      expect(element.find('i').hasClass('mdi-plus')).to.equal(true);
    });

    it('should set color class to the one matching the color attribute', function() {
      initDirective('<fab color="success"></fab>');

      expect(element.hasClass('btn-success')).to.equal(true);
    });

    it('should set color class to the default one when color attribute is not defined', function() {
      initDirective('<fab></fab>');

      expect(element.hasClass('btn-accent')).to.equal(true);
    });

    it('should set type to the value of the "type" attribute when defined', function() {
      initDirective('<fab type="submit"></fab>');

      expect(element[0].type).to.equal('submit');
    });

    it('should set type to "button" when not defined', function() {
      initDirective('<fab></fab>');

      expect(element[0].type).to.equal('button');
    });
  });

  describe('The fabScrollTop directive', function() {

    var elementScrollService;

    beforeEach(inject(function(_$compile_, _$rootScope_, _$window_, _elementScrollService_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $window = _$window_;
      elementScrollService = _elementScrollService_;

      elementScrollService.scrollToTop = sinon.spy();
      $scope = $rootScope.$new();
    }));

    it('should add "hidden" class when linked', function() {
      initDirective('<fab-scroll-top></fab-scroll-top>');

      expect(element.hasClass('hidden')).to.equal(true);
    });

    it('should remove "hidden" class when show is called and vertical scroll is twice the screen size', function() {
      $window.innerHeight = 100;
      $window.scrollY = 250;
      initDirective('<fab-scroll-top></fab-scroll-top>');

      $scope.show();

      expect(element.hasClass('hidden')).to.equal(false);
    });

    it('should not remove "hidden" class when show is called but vertical scroll is not twice the screen size', function() {
      $window.innerHeight = 100;
      $window.scrollY = 150;
      initDirective('<fab-scroll-top></fab-scroll-top>');

      $scope.show();

      expect(element.hasClass('hidden')).to.equal(true);
    });

    it('should add "hidden" class when hide is called', function() {
      $window.innerHeight = 100;
      $window.scrollY = 250;
      initDirective('<fab-scroll-top></fab-scroll-top>');

      $scope.show();
      $scope.hide();

      expect(element.hasClass('hidden')).to.equal(true);
    });

    it('should stop event propagation on click', function() {
      initDirective('<fab-scroll-top></fab-scroll-top>');

      var event = {
        type: 'click',
        stopPropagation: sinon.spy(),
        preventDefault: sinon.spy()
      };
      element.triggerHandler(event);

      expect(event.stopPropagation).to.have.been.called;
      expect(event.preventDefault).to.have.been.called;
    });

    it('should call scrollToTop then hide the button on click', function() {
      $window.innerHeight = 100;
      $window.scrollY = 250;
      initDirective('<fab-scroll-top></fab-scroll-top>');
      $scope.show();

      element.triggerHandler({type: 'click'});

      expect(elementScrollService.scrollToTop).to.have.been.called;
      expect(element.hasClass('hidden')).to.equal(true);
    });
  });

  describe('The dynamicFabDropup directive', function() {

    beforeEach(module('esn.core'));

    beforeEach(inject(function(_$compile_, _$rootScope_, _$document_) {
      this.$compile = _$compile_;
      this.$rootScope = _$rootScope_;
      this.$document = _$document_;
      this.$scope = this.$rootScope.$new();

      this.initDirective = function(scope) {
        var html = '<div><dynamic-fab-dropup anchor="{{anchor}}"/></div>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }));

    it('should set active class on button click', function() {
      this.$scope.anchor = 'MyAnchor';
      var element = this.initDirective(this.$scope);
      var button = element.find('.btn');
      var dropup = element.find('.fab-modal-dropup');
      expect(dropup.hasClass('active')).to.be.false;
      button.click();
      expect(dropup.hasClass('active')).to.be.true;
    });

    it('should remove active class on 2 times button click', function() {
      this.$scope.anchor = 'MyAnchor';
      var element = this.initDirective(this.$scope);
      var button = element.find('.btn');
      var dropup = element.find('.fab-modal-dropup');
      expect(dropup.hasClass('active')).to.be.false;
      button.click();
      expect(dropup.hasClass('active')).to.be.true;
      button.click();
      expect(dropup.hasClass('active')).to.be.false;
    });

    it('should remove active class when clicking outside the FAB', function() {
      this.$scope.anchor = 'MyAnchor';
      var element = this.initDirective(this.$scope);
      var body = this.$document.find('body').eq(0);
      body.append(element);
      var button = element.find('.btn');
      var dropup = element.find('.fab-modal-dropup');
      expect(dropup.hasClass('active')).to.be.false;
      button.click();
      expect(dropup.hasClass('active')).to.be.true;
      element.click();
      expect(dropup.hasClass('active')).to.be.false;
    });
  });

  describe('the autoSizeDynamic dirctive', function() {
    var autosizeSpy;

    beforeEach(module(function($provide) {
      autosizeSpy = sinon.spy();
      $provide.value('autosize', autosizeSpy);
    }));

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
    }));

    it('should not call the autosize service if the condition is false', function() {
      $scope.condition = function() {return false;};

      initDirective('<div auto-size-dynamic="condition()"></div>');

      expect(autosizeSpy).to.have.not.been.called;
    });

    it('should not call the autosize service if no condition is given', function() {
      initDirective('<div auto-size-dynamic></div>');

      expect(autosizeSpy).to.have.not.been.called;
    });

    it('should call the autosize service if the condition is true', function() {
      $scope.condition = function() {return true;};

      initDirective('<div auto-size-dynamic="condition()"></div>');

      expect(autosizeSpy).to.have.been.called;
    });
  });
});
