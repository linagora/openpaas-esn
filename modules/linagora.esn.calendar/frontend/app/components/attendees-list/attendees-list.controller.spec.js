'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The CalAttendeesListController controller', function() {

  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');
  });

  beforeEach(angular.mock.inject(function($controller, $rootScope, $compile, CAL_EVENTS) {
    this.$controller = $controller;
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.$compile = $compile;
    this.CAL_EVENTS = CAL_EVENTS;
    this.context = {};
    this.context.attendees = [
      { email: 'other1@example.com', partstat: 'NEEDS-ACTION', clicked: false },
      { email: 'other2@example.com', partstat: 'ACCEPTED', clicked: true },
      { email: 'other3@example.com', partstat: 'DECLINED', clicked: false },
      { email: 'other4@example.com', partstat: 'TENTATIVE', clicked: true },
      { email: 'other5@example.com', partstat: 'YOLO' }
    ];
    this.context.organizer = { email: 'organizer@openpaas.org' };

    this.initController = function() {
      return this.$controller('CalAttendeesListController', {$scope: this.$scope}, this.context);
    };
  }));

  it('should set up attendee stats correctly', function() {
    var ctrl = this.initController();

    ctrl.$onInit();

    expect(ctrl.attendeesPerPartstat).to.deep.equal({
      'NEEDS-ACTION': 1,
      ACCEPTED: 1,
      TENTATIVE: 1,
      DECLINED: 1,
      OTHER: 1
    });
  });

  it('should fire updateAttendeeStats if CAL_EVENTS.EVENT_ATTENDEES_UPDATE is emited', function() {
    var attendees = [
      { email: 'other1@example.com', partstat: 'ACCEPTED', clicked: false },
      { email: 'other2@example.com', partstat: 'ACCEPTED', clicked: true },
      { email: 'other3@example.com', partstat: 'DECLINED', clicked: false },
      { email: 'other4@example.com', partstat: 'DECLINED', clicked: true },
      { email: 'other5@example.com', partstat: 'YOLO' }
    ];
    var ctrl = this.initController();

    ctrl.$onInit();

    this.$scope.$digest();
    this.$scope.$broadcast(this.CAL_EVENTS.EVENT_ATTENDEES_UPDATE, attendees);

    expect(ctrl.attendeesPerPartstat).to.deep.equal({
      'NEEDS-ACTION': 0,
      ACCEPTED: 2,
      TENTATIVE: 0,
      DECLINED: 2,
      OTHER: 1
    });
  });

  describe('The deleteSelectedAttendees function', function() {
    it('should filter unclicked attendees', function() {
      var ctrl = this.initController();

      ctrl.$onInit();
      ctrl.deleteSelectedAttendees();

      expect(ctrl.attendees).to.deep.equal([
        { email: 'other1@example.com', partstat: 'NEEDS-ACTION', clicked: false },
        { email: 'other3@example.com', partstat: 'DECLINED', clicked: false },
        { email: 'other5@example.com', partstat: 'YOLO' }
      ]);
    });
  });

  describe('The selectAttendee function', function() {
    describe('when user is organizer', function() {
      it('should do nothing if the user is organizer', function() {
        var attendee = { email: 'organizer@openpaas.org', partstat: 'ACCEPTED', clicked: false };
        var ctrl = this.initController();

        ctrl.$onInit();
        ctrl.selectAttendee(attendee);

        expect(attendee.clicked).to.be.false;
        expect(ctrl.attendeeClickedCount).to.equal(0);
      });
    });

    describe('when user is not the organizer', function() {
      it('should set clicked and increase attendee click count', function() {
        var attendee = { email: 'other1@example.com', partstat: 'NEEDS-ACTION' };
        var ctrl = this.initController();

        ctrl.$onInit();
        ctrl.selectAttendee(attendee);

        expect(attendee.clicked).to.be.true;
        expect(ctrl.attendeeClickedCount).to.equal(1);
      });

      it('should unset clicked and decrease attendee click count', function() {
        var attendee = { email: 'other1@example.com', partstat: 'NEEDS-ACTION' };
        var ctrl = this.initController();

        ctrl.$onInit();
        ctrl.selectAttendee(attendee);
        ctrl.selectAttendee(attendee);

        expect(attendee.clicked).to.be.false;
        expect(ctrl.attendeeClickedCount).to.equal(0);
      });
    });
  });
});
