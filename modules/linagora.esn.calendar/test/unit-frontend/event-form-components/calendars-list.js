'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The calendar-lists component', function() {

  beforeEach(function() {
    this.uuid4 = {
      // This is a valid uuid4. Change this if you need other uuids generated.
      _uuid: '00000000-0000-4000-a000-000000000000',
      generate: function() {
        return this._uuid;
      }
    };
    this.calendarService = {
      calendarHomeId: '12345'
    };

    this.locationMock = {};

    var self = this;
    module('jadeTemplates');
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod');
    angular.mock.module(function($provide) {
      $provide.value('uuid4', self.uuid4);
      $provide.value('calendarService', self.calendarService);
      $provide.value('$location', self.locationMock);
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $compile, CalendarCollectionShell, CALENDAR_EVENTS) {
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.$compile = $compile;
    this.CalendarCollectionShell = CalendarCollectionShell;
    this.CALENDAR_EVENTS = CALENDAR_EVENTS;

    this.initDirective = function(scope) {
      var html = '<calendars-list calendars="calendars"/>';
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
  });

  describe('scope.openConfigPanel', function() {
    it('should move to mobile calendars configuration view', function() {
      this.locationMock.url = sinon.spy(function(url) {
        expect(url).to.equal('/calendar/calendars-edit');
      });
      this.initDirective(this.$scope);
      this.eleScope.openConfigPanel();
      expect(this.locationMock.url).to.have.been.calledOnce;
    });
  });

  describe('scope.add', function() {
    it('should move to calendar configuration view', function() {
      this.locationMock.url = sinon.spy(function(url) {
        expect(url).to.equal('/calendar/add');
      });
      this.initDirective(this.$scope);
      this.eleScope.add();
      expect(this.locationMock.url).to.have.been.calledOnce;
    });
  });

  describe('scope.edit', function() {
    it('should move to calendar configuration view passing the good id', function() {
      this.locationMock.url = sinon.spy(function(url) {
        expect(url).to.equal('/calendar/edit/42');
      });

      var cal = {
        id: 42
      };

      this.initDirective(this.$scope);
      this.eleScope.edit(cal);
      expect(this.locationMock.url).to.have.been.calledOnce;
    });
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
