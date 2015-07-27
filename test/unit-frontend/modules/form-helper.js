'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.form.helper Angular module', function() {

  beforeEach(function() {
    module('jadeTemplates');
    module('esn.form.helper');
  });

  describe('passwordMatch directive', function() {
    var html = '<form name="form"><input type="password" name="password1" password-match="settings.password2" ng-model="settings.password1">' +
        '<input type="password" name="password2" ng-model="settings.password2"></form>';
    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    it('should set unique to true when the password does not match', function() {
      var element = this.$compile(html)(this.$rootScope);
      var scope = element.scope();
      scope.settings = {
        password1: 'test',
        password2: 'test2'
      };
      this.$rootScope.$digest();
      expect(scope.form.$invalid).to.be.true;
      expect(scope.form.password1.$error.unique).to.be.true;
    });

    it('should set unique to false when the password does not match', function() {
      var element = this.$compile(html)(this.$rootScope);
      var scope = element.scope();
      scope.settings = {
        password1: 'test',
        password2: 'test'
      };
      this.$rootScope.$digest();
      expect(scope.form.$invalid).to.be.false;
      expect(scope.form.password1.$error.unique).to.be.undefined;
    });
  });

  describe('esnTrackFirstBlur directive', function() {
    var html = '<form name="form"><input type="text" name="test" ng-model="test" esn-track-first-blur></form>';
    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    it('should not set _blur in the model controller when started', function() {
      var element = this.$compile(html)(this.$rootScope);
      var scope = element.scope();
      this.$rootScope.$digest();
      expect(scope.form.test._blur).to.be.undefined;
    });

    it('should not set _blur in the model controller when element is focused', function() {
      var element = this.$compile(html)(this.$rootScope);
      var scope = element.scope();
      var input = element.find('input');
      this.$rootScope.$digest();
      input.focus();
      this.$rootScope.$digest();
      expect(scope.form.test._blur).to.be.undefined;
    });

    it('should set _blur in the model controller when element is blured', function() {
      var element = this.$compile(html)(this.$rootScope);
      var scope = element.scope();
      var input = element.find('input');
      this.$rootScope.$digest();
      input.focus();
      this.$rootScope.$digest();
      input.blur();
      this.$rootScope.$digest();
      expect(scope.form.test._blur).to.be.tr;
    });

  });

  describe('toggleSwitch directive', function() {

    beforeEach(inject(function($compile, $rootScope) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();

      var html = '<toggle-switch></toggle-switch>';
      this.element = this.$compile(html)(this.$scope);
      this.$scope.$digest();
      this.isolateScope = this.element.isolateScope();
    }));

    it('should set ngModel to false if the attribute "ng-model" is undefined', function() {
      expect(this.isolateScope.ngModel).to.equal(false);
    });

    it('should change ngModel to true when toggle is called', function() {
      this.isolateScope.toggle();
      expect(this.isolateScope.ngModel).to.equal(true);
    });
  });

});
