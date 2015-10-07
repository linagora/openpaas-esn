'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The UI module', function() {

  describe('The fab directive', function() {

    beforeEach(module('esn.ui'));
    beforeEach(module('jadeTemplates'));

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();

      this.initDirective = function(scope) {
        var html = '<fab on-click="action()" type="{{type}}"/></fab>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }]));

    it('should set class to the one matching the fab action', function() {
      this.$scope.type = 'create';
      var element = this.initDirective(this.$scope);
      var i = element.find('i');
      expect(i.hasClass('mdi-plus')).to.be.true;
    });

    it('should set class to the default one when action is unknown', function() {
      this.$scope.type = 'unknownaction';
      var element = this.initDirective(this.$scope);
      var i = element.find('i');
      expect(i.hasClass('mdi-content-create')).to.be.true;
    });

    it('should call the scope action when clicking on the fab', function(done) {
      this.$scope.type = 'create';
      this.$scope.action = done();
      var element = this.initDirective(this.$scope);
      element.find('.btn').click();
    });
  });

  describe('The dynamicFabDropup directive', function() {

    beforeEach(module('esn.ui'));
    beforeEach(module('esn.core'));
    beforeEach(module('jadeTemplates'));

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
