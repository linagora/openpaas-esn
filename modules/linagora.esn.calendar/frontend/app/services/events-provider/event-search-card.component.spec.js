'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The cal-event-search-card component', function() {

  beforeEach(function() {
    angular.mock.module('esn.calendar');
  });

  beforeEach(inject(function(_calMoment_, _$componentController_) {
    this.calMoment = _calMoment_;
    this.$componentController = _$componentController_;
  }));

  it('should initialize the ctrl.event, ctrl.start and ctrl.end', function() {
    var bindings = {
      event: { id: 'an event id' },
      start: this.calMoment('2013-02-08'),
      end: this.calMoment('2013-02-08')
    };

    var ctrl = this.$componentController('calEventSearchCard', null, bindings);

    expect(ctrl.event).to.equal(bindings.event);
    expect(ctrl.start).to.equal(bindings.start);
    expect(ctrl.end).to.equal(bindings.end);
  });

});
