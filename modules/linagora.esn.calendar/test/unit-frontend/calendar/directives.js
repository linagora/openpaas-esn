'use strict';

/* global chai: false */
/* global sinon: false */
var expect = chai.expect;

describe('The calendar module directives', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('linagora.esn.graceperiod', 'esn.calendar', 'angular-nicescroll');
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

  describe('autoSizeAndUpdate directive', function() {
    var autosizeSpy;
    beforeEach(function() {
      autosizeSpy = sinon.spy();
      angular.mock.module('esn.form.helper', function($provide) {
        $provide.value('autosize', autosizeSpy);
      });

      angular.mock.inject(function(_$compile_, _$rootScope_) {
        this.$compile = _$compile_;
        this.$rootScope = _$rootScope_;
        this.$scope = this.$rootScope.$new();
      });

      this.initDirective = function(scope) {
        var element = this.$compile('<div auto-size-and-update/>')(scope);
        scope.$digest();
        return element;
      };
    });

    it('should call the autosize service provided by esn.form.helper model', function() {
      this.initDirective(this.$scope);
      expect(autosizeSpy).to.be.called;
    });
  });
});
