'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The calDateToMoment directive', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calMoment');
    angular.mock.module('esn.calendar');

    inject(['$compile', '$rootScope', 'calMoment', function($c, $r, calMoment) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();
      this.calMoment = calMoment;

      this.initDirective = function(scope) {
        var html = '<input ng-model="event.end" data-is-all-day="event.allDay" cal-date-to-moment/>';
        var element = this.$compile(html)(scope);

        scope.$digest();

        return element;
      };
    }]);
  });

  it('should return a calMoment Date if event is allday', function() {
    this.$scope.event = {
      allDay: true
    };
    var element = this.initDirective(this.$scope);
    var parser = element.controller('ngModel').$parsers[0];

    expect(parser('2015-07-03 10:30').hasTime()).to.be.false;
  });

  it('should return a calMoment DateTime if event is not allday', function() {
    this.$scope.event = {
      allDay: false
    };
    var element = this.initDirective(this.$scope);
    var parser = element.controller('ngModel').$parsers[0];

    expect(parser('2015-07-03 10:30').hasTime()).to.be.true;
  });

  describe('comportment for invalid date', function() {
    /* global moment: false */

    beforeEach(function() {
      moment.suppressDeprecationWarnings = true;
    });

    it('should return undefined for invalid date', function() {
      this.$scope.event = {
        allDay: false
      };
      var element = this.initDirective(this.$scope);
      var parser = element.controller('ngModel').$parsers[0];

      expect(parser('this is a bad date')).to.be.undefined;
    });

    afterEach(function() {
      moment.suppressDeprecationWarnings = false;
    });
  });
});
