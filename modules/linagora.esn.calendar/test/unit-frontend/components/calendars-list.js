'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The calendar-lists component', function() {
  var self;

  beforeEach(function() {
    self = this;
    module('jadeTemplates');
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod');

    this.calendarServiceMock = {
      listCalendars: function() {
        return self.$q.when(self.calendars);
      }
    };

    angular.mock.module(function($provide) {
      $provide.value('calendarService', self.calendarServiceMock);
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $compile, CalendarCollectionShell, CALENDAR_EVENTS, $q) {
    this.$q = $q;
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.$scope.selectedCalendarBox = {};
    this.$compile = $compile;
    this.CalendarCollectionShell = CalendarCollectionShell;
    this.CALENDAR_EVENTS = CALENDAR_EVENTS;

    this.initDirective = function(scope) {
      var html = '<calendars-list on-edit-click="click"/>';
      var element = this.$compile(html)(scope);
      scope.$digest();
      this.eleScope = element.isolateScope();
      return element;
    };

    this.calendars = [this.CalendarCollectionShell.from({
      href: 'href',
      name: 'name',
      color: 'color',
      description: 'description'
    }), this.CalendarCollectionShell.from({
      href: 'href2',
      name: 'name2',
      color: 'color2',
      description: 'description2'
    })];
  }));

  it('should correctly initialize scope', function() {
    this.initDirective(this.$scope);

    expect(this.eleScope.hiddenCalendars).to.deep.equal({});

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
        expect(data.calendar.href).to.equal('href');
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
      expect(this.eleScope.hiddenCalendars[this.eleScope.calendars[0].id]).to.be.true;
      expect(toggleSpy).to.have.been.calledOnce;
    });
  });

  describe('scope.selectCalendar', function() {
    it('should set selected on given calendar and remove it on others calendar', function() {
      this.calendars[0].selected = true;
      this.initDirective(this.$scope);
      this.eleScope.selectCalendar(this.calendars[1]);
      expect(this.calendars[1].selected).to.be.true;
      expect(!!this.calendars[0].selected).to.be.false;
    });

    it('should unhide a calendar if the selected calendar was hidden', function() {
      this.initDirective(this.$scope);
      var cal = this.calendars[1];
      this.eleScope.hiddenCalendars[cal.id] = true;

      this.eleScope.selectCalendar(cal);
      expect(!!this.eleScope.hiddenCalendars[cal.id]).to.be.false;
    });

    it('should not hide previous selected calendar', function() {
      this.$scope.selectedCalendarBox.calendar = {id: 3};
      this.initDirective(this.$scope);
      var cal = {id: 42};
      this.eleScope.hiddenCalendars[cal.id] = true;

      this.eleScope.selectCalendar(cal);
      expect(!!this.eleScope.hiddenCalendars[3]).to.be.false;
    });

  });
});
