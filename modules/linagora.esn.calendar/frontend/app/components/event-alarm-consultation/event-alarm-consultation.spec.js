'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The event-alarm-consultation component', function() {

  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');
  });

  beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
    this.$compile = $c;
    this.$scope = $r.$new();

    this.$scope.event = {};

    this.initDirective = function(scope) {
      var html = '<event-alarm-consultation event="event"/>';
      var element = this.$compile(html)(scope);

      scope.$digest();
      this.eleScope = element.isolateScope();

      return element;
    };
  }]));

  beforeEach(function() {
    angular.mock.inject(function(CalendarShell, moment) {
      this.CalendarShell = CalendarShell;
      this.moment = moment;
    });
  });

  it('should get trigger of the alarm when initialize event-alarm-consultation component', function() {
    this.$scope.event = this.CalendarShell.fromIncompleteShell({
      start: this.moment('2013-02-08 12:30'),
      end: this.moment('2013-02-08 13:30'),
      location: 'aLocation',
      alarm: {
        trigger: '-P1W',
        attendee: 'test@open-paas.org'
      }
    });

    this.initDirective(this.$scope);
    expect(this.eleScope.vm.trigger).to.deep.equal('-P1W');
  });
});
