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

    var self = this;
    module('jadeTemplates');
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod');
    angular.mock.module(function($provide) {
      $provide.value('uuid4', self.uuid4);
      $provide.value('calendarService', self.calendarService);
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $compile, CalendarCollectionShell) {
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.$compile = $compile;
    this.CalendarCollectionShell = CalendarCollectionShell;

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
    expect(this.eleScope.newCalendars).to.shallowDeepEqual([{
      href: 'href',
      name: 'name',
      color: 'color',
      description: 'description',
      toggled: true
    }, {
      href: 'href2',
      name: 'name2',
      color: 'color2',
      description: 'description2',
      toggled: true
    }]);
    expect(this.eleScope.oldCalendars).to.shallowDeepEqual([{
      href: 'href',
      name: 'name',
      color: 'color',
      description: 'description',
      toggled: true
    }, {
      href: 'href2',
      name: 'name2',
      color: 'color2',
      description: 'description2',
      toggled: true
    }]);
    expect(this.eleScope.formToggled).to.be.false;
  });

  describe('scope.toggleForm', function() {
    it('should toggle scope.formToggled', function() {
      this.initDirective(this.$scope);
      this.eleScope.toggleForm();
      expect(this.eleScope.formToggled).to.be.true;
    });
  });

  describe('scope.submit', function() {
    it('should emit added and removed calendars, and toggleForm', function() {
      var addedSpy = sinon.spy();
      var removedSpy = sinon.spy();
      this.$rootScope.$on('calendars-list:added', function(event, data) {
        expect(data[0].getHref()).to.equal('href3');
        addedSpy();
      });
      this.$rootScope.$on('calendars-list:removed', function(event, data) {
        expect(data[0].getHref()).to.equal('href');
        removedSpy();
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
      this.eleScope.newCalendars[0] = {
        href: 'href3',
        name: 'name3',
        color: 'color3',
        description: 'description3'
      };
      this.eleScope.$digest();
      this.eleScope.submit();
      expect(addedSpy).to.have.been.calledOnce;
      expect(removedSpy).to.have.been.calledOnce;
      expect(this.eleScope.formToggled).to.be.true;
    });
  });

  describe('scope.remove', function() {
    it('should remove calendars', function() {
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
      this.eleScope.remove({href: 'href'});
      expect(this.eleScope.newCalendars.length).to.equal(1);
      expect(this.eleScope.newCalendars[0]).to.shallowDeepEqual({
        href: 'href2',
        name: 'name2',
        color: 'color2',
        description: 'description2',
        toggled: true
      });
    });
  });

  describe('scope.add', function() {
    it('should push a new calendar', function() {
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
      this.eleScope.newCalendar = {
        name: 'newCal'
      };
      this.eleScope.$digest();
      this.eleScope.add();
      expect(this.eleScope.newCalendars.length).to.equal(3);
      expect(this.eleScope.newCalendars[2]).to.shallowDeepEqual({
        name: 'newCal',
        href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
        toggled: true
      });
    });
  });

  describe('scope.toggleCalendar', function() {
    it('should toggle calendar.toggled and emit the calendar into calendars-list:toggleView', function() {
      var toggleSpy = sinon.spy();
      this.$rootScope.$on('calendars-list:toggleView', function(event, data) {
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
      this.eleScope.toggleCalendar(this.eleScope.newCalendars[0]);
      expect(this.eleScope.newCalendars[0].toggled).to.be.false;
      expect(toggleSpy).to.have.been.calledOnce;
    });
  });

});
