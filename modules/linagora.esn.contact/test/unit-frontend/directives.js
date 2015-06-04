'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contact Angular module directives', function() {

  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('ngRoute');
    angular.mock.module('esn.core');
    angular.mock.module('linagora.esn.contact');
  });

  beforeEach(inject(['$compile', '$rootScope', '$timeout', function($c, $r, $t) {
    this.$compile = $c;
    this.$rootScope = $r;
    this.$scope = this.$rootScope.$new();
    this.$timeout = $t;

    this.initDirective = function(scope) {
      var html = '<inline-editable-input input-class="aClass" type="aType" placeholder="aPlaceholder" ng-model="aModel" on-blur="aBlurFunction" on-save ="aSaveFunction"/>';
      var element = this.$compile(html)(scope);
      scope.$digest();
      return element;
    };
  }]));

  describe('inlineEditableInput', function() {

    it('should have the proper template', function() {
      var html = '<inline-editable-input input-class="aClass" type="aType" placeholder="aPlaceholder" ng-model="aModel" on-blur="aBlurFunction" on-save ="aSaveFunction"/>';
      var element = this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(element.html()).to.deep.equal(
        '<div class="input-group">' +
        '<input type="aType" placeholder="aPlaceholder" ng-model="ngModel" ng-model-options="{updateOn: &quot;blur&quot;}" class="aClass">' +
        '<span ng-show="showGroupButtons" class="inline-input-edition-group-btn inline-remove-button input-group-btn ng-hide">' +
        '<button type="button" ng-click="resetInput()" class="btn btn-default">' +
        '<i class="fa fa-remove"></i>' +
        '</button>' +
        '</span>' +
        '<span ng-show="showGroupButtons" class="inline-input-edition-group-btn inline-check-button input-group-btn ng-hide">' +
        '<button type="button" class="btn btn-default">' +
        '<i class="fa fa-check"></i>' +
        '</button>' +
        '</span>' +
        '</div>');
    });

    it('should bind on focus that toggle the group buttons', function() {
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      input.focus();
      var scope = element.isolateScope();
      this.$timeout.flush();
      expect(scope.showGroupButtons).to.be.true;
    });

    it('should bind on blur and call saveInput if old value !== new value of ng-model controller', function(done) {
      this.$scope.aModel = 'value';
      this.$scope.aSaveFunction = done;
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      input.blur();
      this.$timeout.flush();
    });

    it('should bind on blur and do not call saveInput if old value === new value', function(done) {
      this.$scope.aModel = undefined;
      this.$scope.aSaveFunction = function() {
        done(new Error('should not be called'));
      };
      this.$scope.aBlurFunction = done;
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      input.blur();
      this.$timeout.flush();
    });

    it('should bind on blur, toggle the group buttons and call onBlur after 200 ms', function(done) {
      var scope;
      this.$scope.aModel = 'value';
      this.$scope.aSaveFunction = function() {};
      this.$scope.aBlurFunction = function() {
        expect(scope.showGroupButtons).to.be.true;
        done();
      };
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      input.blur();
      scope = element.isolateScope();
      this.$timeout.flush();
    });

    it('should bind on keydown and call resetInput if escape is the event', function(done) {
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      var scope = element.isolateScope();
      scope.resetInput = done;
      var escape = $.Event('keydown');
      escape.which = 27;
      input.trigger(escape);
      this.$timeout.flush();
    });

  });

});