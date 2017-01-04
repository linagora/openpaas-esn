'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The eventAlarmConsultationController', function() {
  var $controller, TRIGGER, CalendarShell, moment;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function(_$controller_, _TRIGGER_, _CalendarShell_, _moment_) {
      $controller = _$controller_;
      TRIGGER = _TRIGGER_;
      CalendarShell = _CalendarShell_;
      moment = _moment_;
    });
  });

  function initController(bindings) {
    return $controller('eventAlarmConsultationController', null, bindings);
  }

  it('should get trigger of the alarm when initialize event-alarm-consultation component', function() {
    var bindings = {
      event: CalendarShell.fromIncompleteShell({
          start: moment('2013-02-08 12:30'),
          end: moment('2013-02-08 13:30'),
          location: 'aLocation',
          alarm: {
            trigger: '-P1W',
            attendee: 'test@open-paas.org'
          }
        }
      )
    };
    var ctrl = initController(bindings);

    expect(ctrl.trigger).to.deep.equal('-P1W');
  });
});
