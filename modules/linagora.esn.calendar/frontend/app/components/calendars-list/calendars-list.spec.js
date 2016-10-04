'use strict';

/* global chai, sinon: false */

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

    this.hiddenCalendar = {id: 42};
    this.calendarVisibilityServiceMock = {
      getHiddenCalendars: sinon.stub().returns([this.hiddenCalendar]),
      isHidden: sinon.spy(),
      toggle: sinon.spy()
    };

    angular.mock.module(function($provide) {
      $provide.value('calendarService', self.calendarServiceMock);
      $provide.value('calendarVisibilityService', self.calendarVisibilityServiceMock);
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

    expect(this.calendarVisibilityServiceMock.getHiddenCalendars).to.have.been.calledOnce;
    expect(this.eleScope.vm.hiddenCalendars).to.deep.equal({42: true});
    expect(this.eleScope.vm.onEditClick).to.exist;
  });

  it('should call onEditClick on settings icon click', function(done) {
    this.$scope.click = done;
    var element = this.initDirective(this.$scope);

    element.find('.configuration-button').click();
  });

  describe('scope.toggleCalendar', function() {
    it('should call calendarVisibilityService.toggle', function() {
      this.initDirective(this.$scope);
      this.eleScope.vm.toggleCalendar(this.eleScope.vm.calendars[0]);
      expect(this.calendarVisibilityServiceMock.toggle).to.have.been.calledWith(this.calendars[0]);
    });
  });

  describe('CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW listener', function() {
    it('should set the visibility of the calendar', function() {
      this.initDirective(this.$scope);

      this.$rootScope.$broadcast(this.CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, {
        calendar: this.calendars[0],
        hidden: true
      });
      this.$rootScope.$apply();

      expect(this.eleScope.vm.hiddenCalendars[this.calendars[0].id]).to.be.true;

      this.$rootScope.$broadcast(this.CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, {
        calendar: this.calendars[0],
        hidden: false
      });
      this.$rootScope.$apply();

      expect(this.eleScope.vm.hiddenCalendars[this.calendars[0].id]).to.be.false;
    });
  });

  describe('scope.selectCalendar', function() {
    it('should set selected on given calendar and remove it on others calendar', function() {
      this.calendars[0].selected = true;
      this.initDirective(this.$scope);
      this.eleScope.vm.selectCalendar(this.calendars[1]);
      expect(this.calendars[1].selected).to.be.true;
      expect(!!this.calendars[0].selected).to.be.false;
    });

    it('should unhide a calendar if the selected calendar was hidden', function() {
      this.initDirective(this.$scope);
      var cal = this.calendars[1];

      this.eleScope.vm.hiddenCalendars[cal.id] = true;

      this.eleScope.vm.selectCalendar(cal);
      expect(this.calendarVisibilityServiceMock.toggle).to.have.been.calledWith(cal);
    });

    it('should not hide previous selected calendar', function() {
      this.$scope.selectedCalendarBox.calendar = {id: 3};
      this.initDirective(this.$scope);
      var cal = {id: 42};

      this.eleScope.vm.hiddenCalendars[cal.id] = true;

      this.eleScope.vm.selectCalendar(cal);
      expect(!!this.eleScope.vm.hiddenCalendars[3]).to.be.false;
    });
  });
});
