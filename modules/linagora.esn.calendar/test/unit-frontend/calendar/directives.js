'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The calendar module directives', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar', 'angular-nicescroll');
  });

  describe('The toggleNicescroll directive', function() {
      beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_) {
          this.$compile = _$compile_;
          this.$rootScope = _$rootScope_;
          this.$scope = this.$rootScope.$new();

          this.initDirective = function(scope) {
              var element = this.$compile('<div ng-nicescroll/>')(scope);
              var childElement = angular.element('<div toggle-nicescroll/> ');
              childElement.appendTo(element);
              element = this.$compile(element)(scope);
              scope.$digest();

              return element;
          };
      }));

      it('should hide main nicescroll', function() {
          var element = this.initDirective(this.$scope);
          expect(element.getNiceScroll(0).hidden).to.be.true;
      });

      it('should show main nicescroll when destroying calendar view', function() {
          var element = this.initDirective(this.$scope);
          this.$scope.$broadcast('$locationChangeStart');
          expect(element.getNiceScroll(0).visibility).to.be.true;
      });

  });

  describe('calendarLeftPane directive', function() {
    beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_) {
        this.$compile = _$compile_;
        this.$rootScope = _$rootScope_;
        this.$scope = this.$rootScope.$new();

        this.initDirective = function(scope) {
            var element = this.$compile('<calendar-left-pane/>')(scope);
            element = this.$compile(element)(scope);
            scope.$digest();
            return element;
        };
    }));

    it('change element height on calendar:height', function() {
        var element = this.initDirective(this.$scope);
        this.$rootScope.$broadcast('calendar:height', 1200);
        expect(element.height()).to.equal(1200);
    });
  });

});
