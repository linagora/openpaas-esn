'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The calendarEditionController controller', function() {

  beforeEach(function() {
    this.uuid4 = {
      // This is a valid uuid4. Change this if you need other uuids generated.
      _uuid: '00000000-0000-4000-a000-000000000000',
      generate: function() {
        return this._uuid;
      }
    };
    this.calendarService = {};
    this.notificationFactoryMock = {};
    this.stateMock = {};
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
      $provide.value('$state', self.stateMock);
      $provide.value('calendar', self.calendarMock);
      $provide.value('headerService', self.headerServiceMock);
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $q, $controller, CalendarCollectionShell) {
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.CalendarCollectionShell = CalendarCollectionShell;
    this.$scope.calendarHomeId = '12345';

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
    it('should do nothing if the calendar name is empty', function() {
      this.stateMock.go = sinon.spy();
      this.calendarService.modifyCalendar = sinon.spy();
      this.calendarService.createCalendar = sinon.spy();

      this.initController();
      this.$scope.submit();
      expect(this.stateMock.go).to.have.not.been.called;
      expect(this.calendarService.modifyCalendar).to.have.not.been.called;
      expect(this.calendarService.createCalendar).to.have.not.been.called;
    });

    it('should call createCalendar if newCalendar is true (with name having only one char)', function() {
      this.notificationFactoryMock.weakInfo = sinon.spy();
      this.stateMock.go = sinon.spy(function(path) {
        expect(path).to.equal('calendar.main');
      });
      this.calendarService.createCalendar = function(calendarHomeId, shell) {
        expect(calendarHomeId).to.equal('12345');
        expect(shell).to.shallowDeepEqual({
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          name: 'N',
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
      this.$scope.calendar.name = 'N';
      this.$scope.submit();
      expect(this.notificationFactoryMock.weakInfo).to.have.been.called;
      expect(this.stateMock.go).to.have.been.called;
    });

    describe('when newCalendar is false', function() {
      it('should return to calendar.list if the calendar has not been modified', function() {
        this.stateMock.go = sinon.spy(function(path) {
          expect(path).to.equal('calendar.list');
        });
        this.calendarService.modifyCalendar = sinon.spy();

        this.initController();
        this.$scope.calendar.color = 'aColor';
        this.$scope.calendar.name = 'aName';
        this.$scope.oldCalendar.name = 'aName';
        this.$scope.oldCalendar.color = 'aColor';
        this.$scope.newCalendar = false;
        this.$scope.submit();
        expect(this.stateMock.go).to.have.been.called;
        expect(this.calendarService.modifyCalendar).to.have.not.been.called;
      });

      it('should call modifyCalendar if the calendar has been modified (with name having only one char)', function() {
        var modifiedName = 'A';
        this.notificationFactoryMock.weakInfo = sinon.spy();
        this.stateMock.go = sinon.spy(function(path) {
          expect(path).to.equal('calendar.main');
        });
        this.calendarService.modifyCalendar = function(calendarHomeId, shell) {
          expect(calendarHomeId).to.equal('12345');
          expect(shell).to.shallowDeepEqual({
            href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
            name: modifiedName
          });
          return {
            then: function(callback) {
              callback();
            }
          };
        };

        this.$scope.calendar = {
          href: '/calendars/12345/00000000-0000-4000-a000-000000000000.json',
          color: 'aColor',
          name: 'aName'
        };
        this.initController();
        this.$scope.calendar.name = modifiedName;
        this.$scope.newCalendar = false;
        this.$scope.submit();
        expect(this.notificationFactoryMock.weakInfo).to.have.been.called;
        expect(this.stateMock.go).to.have.been.called;
      });
    });
  });
});
