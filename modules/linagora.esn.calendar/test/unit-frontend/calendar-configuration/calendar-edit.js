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
    this.notificationFactoryMock = {};
    this.locationMock = {};
    this.calendarMock = null;
    this.headerServiceMock = {
      subHeader: {
        addInjection: function() {}
      }
    };

    var self = this;
    module('jadeTemplates');
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod');
    angular.mock.module(function($provide) {
      $provide.value('uuid4', self.uuid4);
      $provide.value('calendarService', self.calendarService);
      $provide.value('notificationFactory', self.notificationFactoryMock);
      $provide.value('$location', self.locationMock);
      $provide.value('calendar', self.calendarMock);
      $provide.value('headerService', self.headerServiceMock);
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $q, $controller, CalendarCollectionShell) {
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.CalendarCollectionShell = CalendarCollectionShell;

    this.initController = function() {
      $controller('calendarEditionController', {$scope: this.$scope});
    };
  }));

  it('should correctly initialize scope if newCalendar is true', function() {
    this.initController();
    this.$scope.$digest();
    expect(this.$scope.calendar.href).to.equal('/calendars/12345/00000000-0000-4000-a000-000000000000.json');
    expect(this.$scope.calendar.color).to.exist;
  });

  describe('scope.submit', function() {
    it('should call createCalendar if newCalendar is true', function() {
      this.notificationFactoryMock.weakInfo = sinon.spy();
      this.locationMock.path = sinon.spy(function(path) {
        expect(path).to.equal('/calendar');
      });
      this.calendarService.createCalendar = function(calendarHomeId, shell) {
        expect(calendarHomeId).to.equal('12345');
        expect(shell).to.shallowDeepEqual({
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          name: 'aName',
          color: 'aColor'
        });
        return {
          then: function(callback) {
            callback();
          }
        };
      };
      this.initController();
      this.$scope.calendar.color = 'aColor';
      this.$scope.calendar.name = 'aName';
      this.$scope.submit();
      expect(this.notificationFactoryMock.weakInfo).to.have.been.called;
      expect(this.locationMock.path).to.have.been.called;
    });
  });
});
