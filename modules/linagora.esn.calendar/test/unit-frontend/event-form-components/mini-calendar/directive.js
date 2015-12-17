'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The miniCalendar component', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.fcmoment');
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod');
  });

  describe('miniCalendarMobile directive', function() {
    beforeEach(angular.mock.inject(function($rootScope, $compile, $httpBackend, fcMoment) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.fcMoment = fcMoment;
      this.$compile = $compile;

      this.initDirective = function(scope) {
        var html = '<mini-calendar-mobile calendar-id="123456" class="initial-state"></mini-calendar-mobile>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        this.eleScope = element.isolateScope();
        return element;
      };

      this.$httpBackend.expectGET('/dav/api/calendars/undefined.json').respond(null);
    }));

    it('should remove toggle the mini-calendar on calendar:mini-calendar:toggle', function() {
      var element = this.initDirective(this.$scope);
      this.$rootScope.$broadcast('calendar:mini-calendar:toggle');
      this.$httpBackend.flush();
      expect(element.hasClass('initial-state')).to.be.false;
      expect(element.hasClass('display-none')).to.be.true;
    });
  });
});
