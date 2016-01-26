'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The calendar-lists component', function() {

  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod');
  });

  beforeEach(angular.mock.inject(function($rootScope, $compile, CalendarCollectionShell, CALENDAR_EVENTS) {
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.$compile = $compile;
    this.CalendarCollectionShell = CalendarCollectionShell;
    this.CALENDAR_EVENTS = CALENDAR_EVENTS;

    this.initDirective = function(scope) {
      var html = '<calendars-list calendars="calendars" on-edit-click="click"/>';
      var element = this.$compile(html)(scope);
      scope.$digest();
      this.eleScope = element.isolateScope();
      return element;
    };
  }));

  it('should correctly initialize scope', function() {
    this.$scope.calendars = [this.CalendarCollectionShell.from({
      href: 'href',
      name: 'name',
      color: 'color',
      description: 'description'
    }),
    this.CalendarCollectionShell.from({
      href: 'href2',
      name: 'name2',
      color: 'color2',
      description: 'description2'
    })];
    this.initDirective(this.$scope);

    this.eleScope.calendars.forEach(function(calendar) {
      expect(calendar.toggled).to.be.true;
    });
    expect(this.eleScope.onEditClick).to.exist;
  });

  it('should call onEditClick on settings icon click', function(done) {
    this.$scope.click = done;
    var element = this.initDirective(this.$scope);
    element.find('a.visible-xs').click();
  });

  describe('scope.toggleCalendar', function() {
    it('should toggle calendar.toggled and emit the calendar into CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW', function() {
      var toggleSpy = sinon.spy();
      this.$rootScope.$on(this.CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, function(event, data) {
        expect(data.href).to.equal('href');
        toggleSpy();
      });
      this.$scope.calendars = [this.CalendarCollectionShell.from({
        href: 'href',
        name: 'name',
        color: 'color',
        description: 'description'
      }),
      this.CalendarCollectionShell.from({
        href: 'href2',
        name: 'name2',
        color: 'color2',
        description: 'description2'
      })];
      this.initDirective(this.$scope);
      this.eleScope.toggleCalendar(this.eleScope.calendars[0]);
      expect(this.eleScope.calendars[0].toggled).to.be.false;
      expect(toggleSpy).to.have.been.calledOnce;
    });
  });
});
