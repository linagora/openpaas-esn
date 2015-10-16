'use strict';

/* global chai: false */
var expect = chai.expect;

describe('The calendar module directives', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar', 'angular-nicescroll');
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

  describe('calendarHeaderMobile directive', function() {
    var deviceDestector = {};
    beforeEach(function() {
      angular.mock.module('esn.calendar', function($provide) {
        $provide.value('deviceDetector', deviceDestector);
      });

      angular.mock.inject(function(_$compile_, _$rootScope_) {
        this.$compile = _$compile_;
        this.$rootScope = _$rootScope_;
        this.$scope = this.$rootScope.$new();
      });

      this.initDirective = function(scope) {
        var element = this.$compile('<calendar-header-mobile/>')(scope);
        scope.$digest();
        return element;
      };
    });

    it('should hide the header of fullcalendar on mobile devices', function() {
      this.$scope.uiConfig = {
        calendar: {
        }
      };
      deviceDestector.isMobile = function() {return true;};
      this.initDirective(this.$scope);
      expect(this.$scope.uiConfig.calendar.header).to.be.false;
    });

    it('should not modify the header of fullcalendar on desktops', function() {
      this.$scope.uiConfig = {
        calendar: {
          header: {}
        }
      };
      deviceDestector.isMobile = function() {return false;};
      this.initDirective(this.$scope);
      expect(this.$scope.uiConfig.calendar.header).to.not.be.false;
    });
  });
});
