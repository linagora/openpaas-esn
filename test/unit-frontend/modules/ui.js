'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The UI module', function() {

  var $compile, $rootScope, $scope, element;

  function initDirective(html) {
    element = $compile(html)($scope);
    $scope.$digest();
  }

  beforeEach(module('esn.ui'));
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
});
